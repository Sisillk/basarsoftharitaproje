using backend_new.Models;

namespace backend_new.Interfaces
{
    public interface IGeometryService
    {
        Task<int> AddPointAsync(
            string wkt,
            string name,
            string color,
            int userId
        );

        Task<int> AddLineAsync(
            string wkt,
            string name,
            string color,
            int userId
        );

        Task<int> AddPolygonAsync(
            string wkt,
            string name,
            string color,
            int userId
        );

        Task<List<GeometryItem>> GetPointsAsync(int userId);
        Task<List<GeometryItem>> GetLinesAsync(int userId);
        Task<List<GeometryItem>> GetPolygonsAsync(int userId);

        Task<int> GetIntersectingInventoryCountAsync(
            string polygonWkt
        );

        Task<bool> UpdateGeometryAsync(
            string type,
            int id,
            string wkt,
            string name,
            string color,
            int userId
        );

        Task<bool> SoftDeleteGeometryAsync(
            string type,
            int id,
            int userId
        );
    }
}