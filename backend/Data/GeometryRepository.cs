using backend_new.Interfaces;
using backend_new.Models;
using Npgsql;

namespace backend_new.Data
{
    public class GeometryRepository : IGeometryRepository
    {
        private readonly string _connectionString;

        public GeometryRepository(IConfiguration configuration)
        {
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new Exception("Connection string bulunamadı.");
        }

        public async Task AddPointAsync(string wkt, string name, string color)
        {
            const string sql = @"
                INSERT INTO tbl_point (geom, name, color)
                VALUES (ST_GeomFromText(@wkt, 4326), @name, @color);
            ";

            await ExecuteInsertAsync(sql, wkt, name, color);
        }

        public async Task AddLineAsync(string wkt, string name, string color)
        {
            const string sql = @"
                INSERT INTO tbl_line (geom, name, color)
                VALUES (ST_GeomFromText(@wkt, 4326), @name, @color);
            ";

            await ExecuteInsertAsync(sql, wkt, name, color);
        }

        public async Task AddPolygonAsync(string wkt, string name, string color)
        {
            const string sql = @"
                INSERT INTO tbl_polygon (geom, name, color)
                VALUES (ST_GeomFromText(@wkt, 4326), @name, @color);
            ";

            await ExecuteInsertAsync(sql, wkt, name, color);
        }

        private async Task ExecuteInsertAsync(
            string sql,
            string wkt,
            string name,
            string color)
        {
            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            await using var command = new NpgsqlCommand(sql, connection);

            command.Parameters.AddWithValue("wkt", wkt);
            command.Parameters.AddWithValue("name", name);
            command.Parameters.AddWithValue("color", color);

            await command.ExecuteNonQueryAsync();
        }

        public async Task<List<GeometryItem>> GetPointsAsync()
        {
            return await GetGeometryListAsync(
                @"SELECT
                    id,
                    ST_AsText(geom),
                    COALESCE(name, ''),
                    COALESCE(color, '#ff1744')
                  FROM tbl_point
                  ORDER BY id;"
            );
        }

        public async Task<List<GeometryItem>> GetLinesAsync()
        {
            return await GetGeometryListAsync(
                @"SELECT
                    id,
                    ST_AsText(geom),
                    COALESCE(name, ''),
                    COALESCE(color, '#ff1744')
                  FROM tbl_line
                  ORDER BY id;"
            );
        }

        public async Task<List<GeometryItem>> GetPolygonsAsync()
        {
            return await GetGeometryListAsync(
                @"SELECT
                    id,
                    ST_AsText(geom),
                    COALESCE(name, ''),
                    COALESCE(color, '#ff1744')
                  FROM tbl_polygon
                  ORDER BY id;"
            );
        }

        private async Task<List<GeometryItem>> GetGeometryListAsync(string sql)
        {
            var result = new List<GeometryItem>();

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            await using var command = new NpgsqlCommand(sql, connection);
            await using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                result.Add(new GeometryItem
                {
                    Id = reader.GetInt32(0),
                    Wkt = reader.GetString(1),
                    Name = reader.GetString(2),
                    Color = reader.GetString(3)
                });
            }

            return result;
        }

        public async Task<int> GetIntersectingInventoryCountAsync(string polygonWkt)
        {
            const string sql = @"
                SELECT COUNT(*)
                FROM tbl_inventory
                WHERE ST_Intersects(
                    geom,
                    ST_GeomFromText(@wkt, 4326)
                );
            ";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("wkt", polygonWkt);

            var result = await command.ExecuteScalarAsync();

            return Convert.ToInt32(result);
        }
    }
}
