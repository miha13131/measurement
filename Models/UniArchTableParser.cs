using System;
using System.Buffers.Binary;

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
            const int floatsPerRow = 47;
            const int rowBytes = floatsPerRow * 4;

            if (archBytes.Length < 4 + rowBytes)
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


            int payload = archBytes.Length - 4;
            int totalRows = payload / rowBytes;
            int rows = Math.Min(totalRows, maxRows);

            for (int r = 0; r < rows; r++)
            {
                var row = new float[floatsPerRow];
                int baseOffset = 4 + r * rowBytes;

                for (int c = 0; c < floatsPerRow; c++)
                {
                    uint be = BinaryPrimitives.ReadUInt32BigEndian(
                        archBytes.AsSpan(baseOffset + c * 4, 4));
                    row[c] = BitConverter.Int32BitsToSingle((int)be);
                }

                table.Rows.Add(row);
                table.Time.Add(startLocal.AddMilliseconds((long)r * periodMs));
            }

            return table;
        }
    }
}
