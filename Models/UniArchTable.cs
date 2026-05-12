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
        public static UniArchTable Parse(
            byte[] archBytes,
            DateTime startTimeLocal,
            int periodMs = 60000,
            int maxRows = 1000)
        {
            if (archBytes == null || archBytes.Length < 8)
                throw new ArgumentException("archBytes is empty or too small.");

            int offset = 0;

            if (archBytes.Length >= 4 && archBytes[0] == 0x00 && archBytes[1] == 0x00 && archBytes[2] == 0x00 && archBytes[3] == 0xAD)
                offset = 4;

            int payloadBytes = archBytes.Length - offset;
            if (payloadBytes < 4) throw new ArgumentException("No payload.");

            int totalFloats = payloadBytes / 4;
            if (totalFloats <= 0) throw new ArgumentException("No float data.");

            int floatsPerRow = InferFloatsPerRow(archBytes, offset, totalFloats);
            int rowCount = totalFloats / floatsPerRow;
            int rowsToRead = Math.Min(rowCount, maxRows);
            var table = new UniArchTable();
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
            int[] candidates = new[] { 47, 46, 48, 40, 32, 24, 16, 12, 10, 8, 6, 4 }
                .Where(c => c > 0 && totalFloats % c == 0)
                .ToArray();

            if (candidates.Length == 0)
            {
                return totalFloats;
            }
            float ReadBE(int floatIndex)
            {
                int o = offset + floatIndex * 4;
                uint be = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(o, 4));
                return BitConverter.Int32BitsToSingle((int)be);
            }

            int Score(int c)
            {
                int score = 0;
                int limit = Math.Min(c, 16);
                for (int i = 0; i < limit; i++)
                {
                    float v = ReadBE(i);
                    if (float.IsNaN(v) || float.IsInfinity(v)) return -1000;
                    if (i == 0 && v >= 45 && v <= 65) score += 4;
                    if (i >= 1 && i <= 6 && v >= 100 && v <= 550) score += 2;
                    if (i >= 7 && i <= 12 && v >= 0 && v <= 500) score += 1;

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
