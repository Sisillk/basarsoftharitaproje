using backend_new.Interfaces;
using backend_new.Models;
using Npgsql;

namespace backend_new.Data
{
    public class UserRepository : IUserRepository
    {
        private readonly string _connectionString;

        public UserRepository(IConfiguration configuration)
        {
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new Exception("Connection string bulunamadı.");
        }

        public async Task<List<User>> GetAllAsync()
        {
            const string sql = @"
                SELECT id, name, email, is_deleted, is_active, modified_date
                FROM users
                WHERE is_deleted = FALSE
                ORDER BY id;
            ";

            var users = new List<User>();

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            await using var command = new NpgsqlCommand(sql, connection);
            await using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                users.Add(new User
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1),
                    Email = reader.GetString(2),
                    IsDeleted = reader.GetBoolean(3),
                    IsActive = reader.GetBoolean(4),
                    ModifiedDate = reader.GetDateTime(5)
                });
            }

            return users;
        }

        public async Task AddAsync(User user)
        {
            const string sql = @"
                INSERT INTO users
                    (name, email, is_deleted, is_active, modified_date)
                VALUES
                    (@name, @email, FALSE, TRUE, CURRENT_TIMESTAMP);
            ";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("name", user.Name);
            command.Parameters.AddWithValue("email", user.Email);

            await command.ExecuteNonQueryAsync();
        }
    }
}
