using System.Collections.Generic;
using System.Xml.Linq;

namespace DeviceMeasurementsApp.Models
{
    public static class ArchDefParser
    {
        public static List<UniColumn> ParseColumns(string typeXml)
        {
            var doc = XDocument.Parse(typeXml);

            var cols = new List<UniColumn>();
            int index = 0;

            foreach (var prop in doc.Descendants("PropDesc"))
            {
                var name = prop.Element("PropName")?.Value;
                var unit = prop.Element("Unit")?.Value ?? "";

                if (string.IsNullOrWhiteSpace(name))
                    continue;

                cols.Add(new UniColumn(index++, name, unit));
            }

            return cols;
        }
    }
}
