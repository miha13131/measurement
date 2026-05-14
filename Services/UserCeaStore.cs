using Microsoft.JSInterop;

namespace DeviceMeasurementsApp.Services;

public sealed class UserCeaStore(IJSRuntime js)
{
    private const string DataStorageKey = "measurement.customCea.base64";
    private const string NameStorageKey = "measurement.customCea.name";

    private byte[]? _cachedBytes;
    private string? _cachedName;

    public async Task SaveAsync(byte[] bytes, string fileName)
    {
        _cachedBytes = bytes;
        _cachedName = fileName;

        await js.InvokeVoidAsync("localStorage.setItem", DataStorageKey, Convert.ToBase64String(bytes));
        await js.InvokeVoidAsync("localStorage.setItem", NameStorageKey, fileName);
    }

    public async Task<(byte[] Bytes, string FileName)?> TryGetSavedAsync()
    {
        if (_cachedBytes is not null)
        {
            return (_cachedBytes, _cachedName ?? "saved-data.cea");
        }

        var base64 = await js.InvokeAsync<string?>("localStorage.getItem", DataStorageKey);
        if (string.IsNullOrWhiteSpace(base64)) return null;

        var name = await js.InvokeAsync<string?>("localStorage.getItem", NameStorageKey);

        _cachedBytes = Convert.FromBase64String(base64);
        _cachedName = string.IsNullOrWhiteSpace(name) ? "saved-data.cea" : name;

        return (_cachedBytes, _cachedName);
    }

    public async Task<(CeaZipStore Store, string SourceName)> LoadPreferredAsync(HttpClient http)
    {
        var saved = await TryGetSavedAsync();
        if (saved is not null)
        {
            return (CeaZipStore.FromBytes(saved.Value.Bytes), saved.Value.FileName);
        }

        return (await CeaZipStore.LoadAsync(http, "sample-data/SMY134aEMIx.cea"), "SMY134aEMIx.cea");
    }
}
