using backend_new.Interfaces;
using backend_new.Models;
using System.Text.RegularExpressions;

namespace backend_new.Services
{
    public class GeometryService : IGeometryService
    {
        private readonly IGeometryRepository _geometryRepository;

        public GeometryService(
            IGeometryRepository geometryRepository)
        {
            _geometryRepository = geometryRepository;
        }

        public async Task<int> AddPointAsync(
            string wkt,
            string name,
            string color,
            int userId)
        {
            ValidateGeometry(wkt, name, color, userId);

            return await _geometryRepository.AddPointAsync(
                wkt,
                name,
                color,
                userId
            );
        }

        public async Task<int> AddLineAsync(
            string wkt,
            string name,
            string color,
            int userId)
        {
            ValidateGeometry(wkt, name, color, userId);

            return await _geometryRepository.AddLineAsync(
                wkt,
                name,
                color,
                userId
            );
        }

        public async Task<int> AddPolygonAsync(
            string wkt,
            string name,
            string color,
            int userId)
        {
            ValidateGeometry(wkt, name, color, userId);

            return await _geometryRepository.AddPolygonAsync(
                wkt,
                name,
                color,
                userId
            );
        }

        public async Task<List<GeometryItem>>
            GetPointsAsync(int userId)
        {
            ValidateUserId(userId);

            return await _geometryRepository
                .GetPointsAsync(userId);
        }

        public async Task<List<GeometryItem>>
            GetLinesAsync(int userId)
        {
            ValidateUserId(userId);

            return await _geometryRepository
                .GetLinesAsync(userId);
        }

        public async Task<List<GeometryItem>>
            GetPolygonsAsync(int userId)
        {
            ValidateUserId(userId);

            return await _geometryRepository
                .GetPolygonsAsync(userId);
        }

        public async Task<int>
            GetIntersectingInventoryCountAsync(
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

        public async Task<bool> UpdateGeometryAsync(
            string type,
            int id,
            string wkt,
            string name,
            string color,
            int userId)
        {
            ValidateType(type);
            ValidateId(id);
            ValidateGeometry(wkt, name, color, userId);

            return await _geometryRepository
                .UpdateGeometryAsync(
                    type,
                    id,
                    wkt,
                    name,
                    color,
                    userId
                );
        }

        public async Task<bool> SoftDeleteGeometryAsync(
            string type,
            int id,
            int userId)
        {
            ValidateType(type);
            ValidateId(id);
            ValidateUserId(userId);

            return await _geometryRepository
                .SoftDeleteGeometryAsync(
                    type,
                    id,
                    userId
                );
        }

        private static void ValidateGeometry(
            string wkt,
            string name,
            string color,
            int userId)
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

            ValidateUserId(userId);
        }

        private static void ValidateUserId(int userId)
        {
            if (userId <= 0)
            {
                throw new ArgumentException(
                    "Geçersiz kullanıcı."
                );
            }
        }

        private static void ValidateId(int id)
        {
            if (id <= 0)
            {
                throw new ArgumentException(
                    "Geçersiz obje ID."
                );
            }
        }

        private static void ValidateType(string type)
        {
            if (
                type != "point" &&
                type != "line" &&
                type != "polygon"
            )
            {
                throw new ArgumentException(
                    "Geçersiz geometri tipi."
                );
            }
        }
    }
}