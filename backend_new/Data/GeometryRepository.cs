using backend_new.Interfaces;
using backend_new.Models;
using Npgsql;

namespace backend_new.Data
{
    public class GeometryRepository : IGeometryRepository
    {
        private readonly string _connectionString;

        public GeometryRepository(
            IConfiguration configuration)
        {
            _connectionString =
                configuration.GetConnectionString(
                    "DefaultConnection"
                )
                ?? throw new Exception(
                    "Connection string bulunamadı."
                );
        }

        public async Task<int> AddPointAsync(
            string wkt,
            string name,
            string color,
            int userId)
        {
            const string sql = @"
                INSERT INTO tbl_point
                (
                    geom,
                    name,
                    color,
                    inserted_user_id,
                    inserted_date,
                    modified_date,
                    is_deleted,
                    is_active
                )
                VALUES
                (
                    ST_GeomFromText(@wkt, 4326),
                    @name,
                    @color,
                    @userId,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    FALSE,
                    TRUE
                )
                RETURNING id;
            ";

            return await ExecuteInsertAsync(
                sql, wkt, name, color, userId
            );
        }

        public async Task<int> AddLineAsync(
            string wkt,
            string name,
            string color,
            int userId)
        {
            const string sql = @"
                INSERT INTO tbl_line
                (
                    geom,
                    name,
                    color,
                    inserted_user_id,
                    inserted_date,
                    modified_date,
                    is_deleted,
                    is_active
                )
                VALUES
                (
                    ST_GeomFromText(@wkt, 4326),
                    @name,
                    @color,
                    @userId,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    FALSE,
                    TRUE
                )
                RETURNING id;
            ";

            return await ExecuteInsertAsync(
                sql, wkt, name, color, userId
            );
        }

        public async Task<int> AddPolygonAsync(
            string wkt,
            string name,
            string color,
            int userId)
        {
            const string sql = @"
                INSERT INTO tbl_polygon
                (
                    geom,
                    name,
                    color,
                    inserted_user_id,
                    inserted_date,
                    modified_date,
                    is_deleted,
                    is_active
                )
                VALUES
                (
                    ST_GeomFromText(@wkt, 4326),
                    @name,
                    @color,
                    @userId,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    FALSE,
                    TRUE
                )
                RETURNING id;
            ";

            return await ExecuteInsertAsync(
                sql, wkt, name, color, userId
            );
        }

        private async Task<int> ExecuteInsertAsync(
            string sql,
            string wkt,
            string name,
            string color,
            int userId)
        {
            await using var connection =
                new NpgsqlConnection(_connectionString);

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(sql, connection);

            command.Parameters.AddWithValue("wkt", wkt);
            command.Parameters.AddWithValue("name", name);
            command.Parameters.AddWithValue("color", color);
            command.Parameters.AddWithValue("userId", userId);

            var result =
                await command.ExecuteScalarAsync();

            return Convert.ToInt32(result);
        }

        public async Task<List<GeometryItem>>
            GetPointsAsync(int userId)
        {
            const string sql = @"
                SELECT
                    id,
                    ST_AsText(geom),
                    COALESCE(name, ''),
                    COALESCE(color, '#ff1744')
                FROM tbl_point
                WHERE inserted_user_id = @userId
                  AND is_deleted = FALSE
                  AND is_active = TRUE
                ORDER BY id;
            ";

            return await GetGeometryListAsync(
                sql,
                userId
            );
        }

        public async Task<List<GeometryItem>>
            GetLinesAsync(int userId)
        {
            const string sql = @"
                SELECT
                    id,
                    ST_AsText(geom),
                    COALESCE(name, ''),
                    COALESCE(color, '#ff1744')
                FROM tbl_line
                WHERE inserted_user_id = @userId
                  AND is_deleted = FALSE
                  AND is_active = TRUE
                ORDER BY id;
            ";

            return await GetGeometryListAsync(
                sql,
                userId
            );
        }

        public async Task<List<GeometryItem>>
            GetPolygonsAsync(int userId)
        {
            const string sql = @"
                SELECT
                    id,
                    ST_AsText(geom),
                    COALESCE(name, ''),
                    COALESCE(color, '#ff1744')
                FROM tbl_polygon
                WHERE inserted_user_id = @userId
                  AND is_deleted = FALSE
                  AND is_active = TRUE
                ORDER BY id;
            ";

            return await GetGeometryListAsync(
                sql,
                userId
            );
        }

        private async Task<List<GeometryItem>>
            GetGeometryListAsync(
                string sql,
                int userId)
        {
            var result =
                new List<GeometryItem>();

            await using var connection =
                new NpgsqlConnection(_connectionString);

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(sql, connection);

            command.Parameters.AddWithValue(
                "userId",
                userId
            );

            await using var reader =
                await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                result.Add(
                    new GeometryItem
                    {
                        Id = reader.GetInt32(0),
                        Wkt = reader.GetString(1),
                        Name = reader.GetString(2),
                        Color = reader.GetString(3)
                    }
                );
            }

            return result;
        }

        public async Task<int>
            GetIntersectingInventoryCountAsync(
                string polygonWkt)
        {
            const string sql = @"
                SELECT COUNT(*)
                FROM tbl_inventory
                WHERE ST_Intersects(
                    geom,
                    ST_GeomFromText(@wkt, 4326)
                );
            ";

            await using var connection =
                new NpgsqlConnection(_connectionString);

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(sql, connection);

            command.Parameters.AddWithValue(
                "wkt",
                polygonWkt
            );

            var result =
                await command.ExecuteScalarAsync();

            return Convert.ToInt32(result);
        }

        public async Task<bool> UpdateGeometryAsync(
            string type,
            int id,
            string wkt,
            string name,
            string color,
            int userId)
        {
            string table = GetTableName(type);

            string sql = $@"
                UPDATE {table}
                SET
                    geom = ST_GeomFromText(@wkt, 4326),
                    name = @name,
                    color = @color,
                    modified_date = CURRENT_TIMESTAMP
                WHERE id = @id
                  AND inserted_user_id = @userId
                  AND is_deleted = FALSE;
            ";

            await using var connection =
                new NpgsqlConnection(_connectionString);

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(sql, connection);

            command.Parameters.AddWithValue("wkt", wkt);
            command.Parameters.AddWithValue("name", name);
            command.Parameters.AddWithValue("color", color);
            command.Parameters.AddWithValue("id", id);
            command.Parameters.AddWithValue("userId", userId);

            int affected =
                await command.ExecuteNonQueryAsync();

            return affected > 0;
        }

        public async Task<bool> SoftDeleteGeometryAsync(
            string type,
            int id,
            int userId)
        {
            string table = GetTableName(type);

            string sql = $@"
                UPDATE {table}
                SET
                    is_deleted = TRUE,
                    is_active = FALSE,
                    modified_date = CURRENT_TIMESTAMP
                WHERE id = @id
                  AND inserted_user_id = @userId
                  AND is_deleted = FALSE;
            ";

            await using var connection =
                new NpgsqlConnection(_connectionString);

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(sql, connection);

            command.Parameters.AddWithValue("id", id);
            command.Parameters.AddWithValue(
                "userId",
                userId
            );

            int affected =
                await command.ExecuteNonQueryAsync();

            return affected > 0;
        }

        private static string GetTableName(
            string type)
        {
            return type switch
            {
                "point" => "tbl_point",
                "line" => "tbl_line",
                "polygon" => "tbl_polygon",

                _ => throw new ArgumentException(
                    "Geçersiz geometri tipi."
                )
            };
        }
    }
}