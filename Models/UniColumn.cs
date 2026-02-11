namespace DeviceMeasurementsApp.Models
{
    public sealed record UniColumn(
        int Index,
        string Name,
        string Unit
    )
    {
        public string DisplayName =>
            string.IsNullOrWhiteSpace(Unit)
                ? Name
                : $"{Name} [{Unit}]";
    }
}
