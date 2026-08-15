using backend_new.Interfaces;
using backend_new.Models;
using System.Text.RegularExpressions;

namespace backend_new.Services
{
    public class GeometryService : IGeometryService
    {
        private readonly IGeometryRepository _geometryRepository;

        public GeometryService(IGeometryRepository geometryRepository)
        {
            _geometryRepository = geometryRepository;
        }

        public async Task AddPointAsync(
            string wkt,
            string name,
            string color)
        {
            ValidateGeometry(wkt, name, color);

            await _geometryRepository.AddPointAsync(
                wkt,
                name,
                color
            );
        }

        public async Task AddLineAsync(
            string wkt,
            string name,
            string color)
        {
            ValidateGeometry(wkt, name, color);

            await _geometryRepository.AddLineAsync(
                wkt,
                name,
                color
            );
        }

        public async Task AddPolygonAsync(
            string wkt,
            string name,
            string color)
        {
            ValidateGeometry(wkt, name, color);

            await _geometryRepository.AddPolygonAsync(
                wkt,
                name,
                color
            );
        }

        public async Task<List<GeometryItem>> GetPointsAsync()
        {
            return await _geometryRepository.GetPointsAsync();
        }

        public async Task<List<GeometryItem>> GetLinesAsync()
        {
            return await _geometryRepository.GetLinesAsync();
        }

        public async Task<List<GeometryItem>> GetPolygonsAsync()
        {
            return await _geometryRepository.GetPolygonsAsync();
        }

        public async Task<int> GetIntersectingInventoryCountAsync(
            string polygonWkt)
        {
            if (string.IsNullOrWhiteSpace(polygonWkt))
            {
                throw new ArgumentException(
                    "Analiz poligonu boş olamaz."
                );
            }

            return await _geometryRepository
                .GetIntersectingInventoryCountAsync(
                    polygonWkt
                );
        }

        private static void ValidateGeometry(
            string wkt,
            string name,
            string color)
        {
            if (string.IsNullOrWhiteSpace(wkt))
            {
                throw new ArgumentException(
                    "WKT bilgisi boş olamaz."
                );
            }

            if (string.IsNullOrWhiteSpace(name))
            {
                throw new ArgumentException(
                    "İsim boş olamaz."
                );
            }

            if (
                string.IsNullOrWhiteSpace(color) ||
                !Regex.IsMatch(
                    color,
                    "^#[0-9A-Fa-f]{6}$"
                )
            )
            {
                throw new ArgumentException(
                    "Geçerli bir renk seçilmelidir."
                );
            }
        }
    }
}