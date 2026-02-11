using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace DeviceMeasurementsApp.Models
{
    public sealed class UniArchTable
    {
        public List<DateTime> Time { get; } = new();
        public List<UniColumn> Columns { get; } = new();
        public List<float[]> Rows { get; } = new();
    }

    public static class ArchTableParser
    {
        // Most common in your file: marker 00 00 00 AD, then BE float32 payload.
        public static UniArchTable Parse(
            byte[] archBytes,
            DateTime startTimeLocal,
            int periodMs = 60000,
            int maxRows = 500)
        {
            if (archBytes == null || archBytes.Length < 8)
                throw new ArgumentException("archBytes is empty or too small.");

            int offset = 0;

            // If marker exists (00 00 00 AD), skip 4 bytes
            if (archBytes.Length >= 4 && archBytes[0] == 0x00 && archBytes[1] == 0x00 && archBytes[2] == 0x00 && archBytes[3] == 0xAD)
                offset = 4;

            int payloadBytes = archBytes.Length - offset;
            if (payloadBytes < 4) throw new ArgumentException("No payload.");

            // Infer floats-per-row: try candidates that divide the payload and produce reasonable values.
            int totalFloats = payloadBytes / 4;
            if (totalFloats <= 0) throw new ArgumentException("No float data.");

            int floatsPerRow = InferFloatsPerRow(archBytes, offset, totalFloats);

            int rowCount = totalFloats / floatsPerRow;
            int rowsToRead = Math.Min(rowCount, maxRows);

            var table = new UniArchTable();

            // Column names in English; we name known indexes when possible, rest = ColXX.
            // If floatsPerRow differs, we still generate correct number of columns.
            table.Columns.AddRange(BuildColumns(floatsPerRow));

            for (int i = 0; i < rowsToRead; i++)
            {
                var row = new float[floatsPerRow];
                int baseOff = offset + i * floatsPerRow * 4;

                for (int j = 0; j < floatsPerRow; j++)
                {
                    uint be = BinaryPrimitives.ReadUInt32BigEndian(archBytes.AsSpan(baseOff + j * 4, 4));
                    row[j] = BitConverter.Int32BitsToSingle((int)be);
                }

                table.Rows.Add(row);
                table.Time.Add(startTimeLocal.AddMilliseconds((long)i * periodMs));
            }

            return table;
        }

        private static int InferFloatsPerRow(byte[] bytes, int offset, int totalFloats)
        {
            // Candidate row widths. Your dataset often uses 47, but others may differ.
            // We prioritize plausible industrial measurement layouts.
            int[] candidates = new[] { 47, 46, 48, 40, 32, 24, 16, 12, 10, 8, 6, 4 }
                .Where(c => c > 0 && totalFloats % c == 0)
                .ToArray();

            if (candidates.Length == 0)
            {
                // fallback: treat as a single long row
                return totalFloats;
            }

            // Score by checking first row plausibility:
            // - frequency around 45..65 (if present at index 0)
            // - voltages around 100..500 (if present at indexes 1..6)
            // - currents around 0..500 (indexes 7..9)
            float ReadBE(int floatIndex)
            {
                int o = offset + floatIndex * 4;
                uint be = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(o, 4));
                return BitConverter.Int32BitsToSingle((int)be);
            }

            int Score(int c)
            {
                int score = 0;

                // Only check first row floats [0..min(c-1, 15)]
                int limit = Math.Min(c, 16);

                for (int i = 0; i < limit; i++)
                {
                    float v = ReadBE(i);

                    if (float.IsNaN(v) || float.IsInfinity(v)) return -1000;

                    // Frequency
                    if (i == 0 && v >= 45 && v <= 65) score += 4;

                    // Typical voltages
                    if (i >= 1 && i <= 6 && v >= 100 && v <= 550) score += 2;

                    // Typical currents
                    if (i >= 7 && i <= 12 && v >= 0 && v <= 500) score += 1;

                    // Penalize totally tiny / huge values early
                    if (Math.Abs(v) > 1e6) score -= 3;
                }

                return score;
            }

            return candidates
                .OrderByDescending(Score)
                .First();
        }

        private static List<UniColumn> BuildColumns(int floatsPerRow)
        {
            var cols = new List<UniColumn>(floatsPerRow);

            for (int i = 0; i < floatsPerRow; i++)
            {
                cols.Add(new UniColumn(
                    i,
                    $"Value{i + 1}",
                    ""
                   // $"Value {i + 1}"
                ));
            }

            return cols;
        }
    }
    }
