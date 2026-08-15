using backend_new.Models;

namespace backend_new.Interfaces
{
    public interface IGeometryRepository
    {
        Task AddPointAsync(string wkt, string name, string color);
        Task AddLineAsync(string wkt, string name, string color);
        Task AddPolygonAsync(string wkt, string name, string color);

        Task<List<GeometryItem>> GetPointsAsync();
        Task<List<GeometryItem>> GetLinesAsync();
        Task<List<GeometryItem>> GetPolygonsAsync();

        Task<int> GetIntersectingInventoryCountAsync(string polygonWkt);
    }
}
