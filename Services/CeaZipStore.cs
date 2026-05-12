using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace DeviceMeasurementsApp.Services
{
    public sealed class CeaZipStore
    {
        public sealed record RecRef(int Id, string Name);
        public sealed record BinPackRef(DateTime TimeUtc, string Entry);

        private readonly byte[] _zip;

        private CeaZipStore(byte[] zip) => _zip = zip;

        public static CeaZipStore FromBytes(byte[] bytes) => new(bytes);

        public static async Task<CeaZipStore> LoadAsync(HttpClient http, string path)
        {
            var bytes = await http.GetByteArrayAsync(path);
            return new CeaZipStore(bytes);
        }

        private ZipArchive Open() => new(new MemoryStream(_zip), ZipArchiveMode.Read);

        public List<RecRef> GetRecords()
        {
            using var z = Open();

            var treeEntry = z.GetEntry("Info/TreeList.xml");
            if (treeEntry != null)
            {
                using var stream = treeEntry.Open();
                var doc = XDocument.Load(stream);

                var records = doc
                    .Descendants("Record")
                    .Select(r => new
                    {
                        Name = (r.Element("record")?.Value ?? string.Empty).Trim(),
                        IdText = (r.Element("ID")?.Value ?? string.Empty).Trim()
                    })
                    .Where(x => int.TryParse(x.IdText, out _)).Select(x => new RecRef(int.Parse(x.IdText), string.IsNullOrWhiteSpace(x.Name) ? $"Object {x.IdText}" : x.Name)).GroupBy(x => x.Id)
                    .Select(g => g.First()).OrderBy(x => x.Id).ToList();

                if (records.Count > 0) return records;
            }

            return z.Entries.Where(e => e.FullName.StartsWith("UNI/")).Select(e => e.FullName.Split('/', StringSplitOptions.RemoveEmptyEntries)).Where(parts => parts.Length >= 2 && int.TryParse(parts[1], out _))
                .Select(parts => int.Parse(parts[1])).Distinct().OrderBy(x => x).Select(id => new RecRef(id, $"Object {id}")).ToList();
        }

        public List<byte> GetArchIds(int recId)
        {
            using var z = Open();

            return z.Entries.Where(e => e.FullName.StartsWith($"UNI/{recId}/")).Select(e => e.FullName.Split('/')[2]).Distinct().Select(byte.Parse).OrderBy(x => x).ToList();
        }

        public List<BinPackRef> GetBinPacks(int recId, byte archId)
        {
            using var z = Open();
            var list = new List<BinPackRef>();

            foreach (var e in z.Entries)
            {
                if (!e.FullName.StartsWith($"UNI/{recId}/{archId}/")) continue;
                if (!e.FullName.EndsWith(".arch")) continue;

                var name = Path.GetFileNameWithoutExtension(e.FullName);
                if (DateTime.TryParseExact(name, "yyyy-MM-dd-HH-mm-ss-fff", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var dt))
                {
                    list.Add(new BinPackRef(dt, e.FullName));
                }
            }

            return list.OrderBy(x => x.TimeUtc).ToList();
        }

        public string ReadArchDefXml(int recId, byte archId)
        {
            using var z = Open();

            var headerEntry = z.GetEntry($"UNI/{recId}/{archId}/header.bin");
            if (headerEntry == null)
                throw new InvalidOperationException($"header.bin not found for rec={recId}, arch={archId}");

            byte[] header;
            using (var hs = headerEntry.Open())
            using (var hms = new MemoryStream())
            {
                hs.CopyTo(hms);
                header = hms.ToArray();
            }

            if (header.Length < 24)
                throw new InvalidOperationException("header.bin is too small");

            int archDefId = BinaryPrimitives.ReadInt32LittleEndian(header.AsSpan(20, 4));
            var archDefPrefix = $"UNI/ArchDefs/{archDefId:X8}-";

            var entry = z.Entries.FirstOrDefault(e => e.FullName.StartsWith(archDefPrefix) && e.FullName.EndsWith(".uad"));

            if (entry == null)
            {
                entry = z.Entries.First(e => e.FullName.StartsWith("UNI/ArchDefs/") && e.FullName.EndsWith(".uad"));
            }

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