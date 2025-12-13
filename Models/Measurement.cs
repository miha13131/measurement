namespace DeviceMeasurementsApp.Models
{
    public class Measurement
    {
        public int DeviceId { get; set; }
        public DateTime Timestamp { get; set; }
        public double Value { get; set; }
    }
}
