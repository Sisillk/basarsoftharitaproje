namespace backend_new.Models
{
    public class GeometryItem
    {
        public int Id { get; set; }
        public string Wkt { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }
}
