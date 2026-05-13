using System;

namespace DeviceMeasurementsApp.Services
{
    public sealed class UploadedCeaState
    {
        private byte[]? _bytes;

        public string FileName { get; private set; } = string.Empty;
        public DateTimeOffset? UploadedAtUtc { get; private set; }
        public bool HasFile => _bytes is { Length: > 0 };

        public void Save(byte[] bytes, string fileName)
        {
            _bytes = bytes ?? throw new ArgumentNullException(nameof(bytes));
            FileName = string.IsNullOrWhiteSpace(fileName) ? "uploaded.cea" : fileName;
            UploadedAtUtc = DateTimeOffset.UtcNow;
        }

        public CeaZipStore? TryCreateStore()
        {
            if (!HasFile)
            {
                return null;
            }

            return CeaZipStore.FromBytes(_bytes!);
        }

        public void Clear()
        {
            _bytes = null;
            FileName = string.Empty;
            UploadedAtUtc = null;
        }
    }
}
