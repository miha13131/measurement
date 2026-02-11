using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading.Tasks;

namespace DeviceMeasurementsApp.Services
{
    public sealed class CeaZipStore
    {
        private readonly byte[] _zip;

        private CeaZipStore(byte[] zip) => _zip = zip;

        public static async Task<CeaZipStore> LoadAsync(HttpClient http, string path)
        {
            var bytes = await http.GetByteArrayAsync(path);
            return new CeaZipStore(bytes);
        }

        private ZipArchive Open()
            => new(new MemoryStream(_zip), ZipArchiveMode.Read);

        public List<byte> GetArchIds(int recId)
        {
            using var z = Open();
            return z.Entries
                .Where(e => e.FullName.StartsWith($"UNI/{recId}/"))
                .Select(e => e.FullName.Split('/')[2])
                .Distinct()
                .Select(byte.Parse)
                .OrderBy(x => x)
                .ToList();
        }

        public sealed record BinPackRef(DateTime TimeUtc, string Entry);

        public List<BinPackRef> GetBinPacks(int recId, byte archId)
        {
            using var z = Open();
            var list = new List<BinPackRef>();

            foreach (var e in z.Entries)
            {
                if (!e.FullName.StartsWith($"UNI/{recId}/{archId}/")) continue;
                if (!e.FullName.EndsWith(".arch")) continue;

                var name = Path.GetFileNameWithoutExtension(e.FullName);
                if (DateTime.TryParseExact(
                        name,
                        "yyyy-MM-dd-HH-mm-ss-fff",
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.AssumeUniversal,
                        out var dt))
                {
                    list.Add(new BinPackRef(dt, e.FullName));
                }
            }

            return list.OrderBy(x => x.TimeUtc).ToList();
        }
        public string ReadArchDefXml()
        {
            using var z = Open();

            var entry = z.Entries.First(e =>
                e.FullName.StartsWith("UNI/ArchDefs/") &&
                e.FullName.EndsWith(".uad"));

            using var s = entry.Open();
            using var sr = new StreamReader(s);
            return sr.ReadToEnd();
        }

        public byte[] Read(string entry)
        {
            using var z = Open();
            using var s = z.GetEntry(entry)!.Open();
            using var ms = new MemoryStream();
            s.CopyTo(ms);
            return ms.ToArray();
        }
    }
}
