using System;
using System.Threading.Tasks;

namespace DeviceMeasurementsApp.Services
{
    public sealed class CeaDataContext
    {
        private byte[]? _customBytes;

        public string? CurrentFileName { get; private set; }

        public bool HasCustomData => _customBytes is { Length: > 0 };

        public void SetCustomData(byte[] bytes, string? fileName = null)
        {
            _customBytes = bytes;
            CurrentFileName = fileName;
        }

        public void ClearCustomData()
        {
            _customBytes = null;
            CurrentFileName = null;
        }

        public Task<CeaZipStore> LoadStoreAsync(HttpClient http)
        {
            if (HasCustomData)
            {
                return Task.FromResult(CeaZipStore.FromBytes(_customBytes!));
            }

            return CeaZipStore.LoadAsync(http, "sample-data/SMY134aEMIx.cea");
        }
    }
}
