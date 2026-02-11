using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.Linq;

namespace DeviceMeasurementsApp.Models
{
    public static class UniArchTableParser
    {
        public static UniArchTable ParseMinuteTable(
            byte[] archBytes,
            DateTime startLocal,
            int periodMs = 60000,
            int maxRows = 300)
        {
            // Minute archives in common EMI cases use 47 float32 values per row,
            // where first 2 are service fields.
            // MAIN uses a wider row layout, so we infer row width dynamically
            // and fallback to 47 when inference is not reliable.
            const int serviceFloatsPerRow = 2;

            int rawFloatsPerRow = InferRawFloatsPerRow(archBytes);
            int floatsPerRow = rawFloatsPerRow - serviceFloatsPerRow;
            int rowBytes = rawFloatsPerRow * 4;

            if (archBytes.Length < rowBytes)
                throw new ArgumentException("arch file too small");

            var table = new UniArchTable();

            // Column names (English, like original)
            for (int i = 0; i < floatsPerRow; i++)
            {
                table.Columns.Add(new UniColumn(
                    Index: i,
                    Name: $"Value{i + 1}",
                    Unit: ""
                   // DisplayName: $"Value {i + 1}"
                ));
            }


            int totalRows = archBytes.Length / rowBytes;
            int rows = Math.Min(totalRows, maxRows);

            for (int r = 0; r < rows; r++)
            {
                var row = new float[floatsPerRow];
                int baseOffset = r * rowBytes;

                for (int c = 0; c < floatsPerRow; c++)
                {
                    uint be = BinaryPrimitives.ReadUInt32BigEndian(
                        archBytes.AsSpan(baseOffset + (c + serviceFloatsPerRow) * 4, 4));
                    row[c] = BitConverter.Int32BitsToSingle((int)be);
                }

                table.Rows.Add(row);
                table.Time.Add(startLocal.AddMilliseconds((long)r * periodMs));
            }

            return table;
        }

        private static int InferRawFloatsPerRow(byte[] archBytes)
        {
            const uint marker = 0x000000AD;

            if (archBytes.Length < 16)
                throw new ArgumentException("arch file too small");

            var markerFloatIndexes = new List<int>();
            int maxFloatsToScan = Math.Min(30000, archBytes.Length / 4);

            for (int i = 0; i < maxFloatsToScan; i++)
            {
                uint be = BinaryPrimitives.ReadUInt32BigEndian(archBytes.AsSpan(i * 4, 4));
                if (be == marker)
                    markerFloatIndexes.Add(i);
            }

            if (markerFloatIndexes.Count < 3)
                return 47;

            var topDiffs = markerFloatIndexes
                .Zip(markerFloatIndexes.Skip(1), (a, b) => b - a)
                .Where(d => d > 1)
                .GroupBy(d => d)
                .Select(g => new { Diff = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ThenByDescending(x => x.Diff)
                .Take(3)
                .ToArray();

            if (topDiffs.Length == 0)
                return 47;

            var candidates = new HashSet<int>(topDiffs.Select(x => x.Diff));
            if (topDiffs.Length >= 2)
            {
                candidates.Add(topDiffs[0].Diff + topDiffs[1].Diff);
            }

            int totalFloats = archBytes.Length / 4;

            int Score(int rawFloatsPerRow)
            {
                if (rawFloatsPerRow < 3 || totalFloats % rawFloatsPerRow != 0)
                    return -1;

                int rowBytes = rawFloatsPerRow * 4;
                int rows = totalFloats / rawFloatsPerRow;
                int sampleRows = Math.Min(rows, 300);
                int markerHits = 0;

                for (int r = 0; r < sampleRows; r++)
                {
                    uint start = BinaryPrimitives.ReadUInt32BigEndian(
                        archBytes.AsSpan(r * rowBytes, 4));
                    if (start == marker)
                        markerHits++;
                }

                return markerHits;
            }

            var best = candidates
                .Select(c => new { Candidate = c, Score = Score(c) })
                .Where(x => x.Score >= 0)
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Candidate)
                .FirstOrDefault();

            return best?.Candidate ?? 47;
        }
    }
}
