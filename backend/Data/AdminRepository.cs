using backend_new.Interfaces;
using backend_new.Models;
using Npgsql;

namespace backend_new.Data
{
    public class AdminRepository : IAdminRepository
    {
        private readonly string _connectionString;

        public AdminRepository(
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


        // =========================================
        // KULLANICILAR
        // =========================================

        public async Task<List<User>> GetUsersAsync()
        {
            const string sql = @"
                select
                    id,
                    name,
                    email,
                    is_deleted,
                    is_active,
                    modified_date
                from users
                where is_deleted = false
                order by id;
            ";

            var users = new List<User>();

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            await using var reader =
                await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                users.Add(
                    new User
                    {
                        Id =
                            reader.GetInt32(0),

                        Name =
                            reader.IsDBNull(1)
                                ? ""
                                : reader.GetString(1),

                        Email =
                            reader.IsDBNull(2)
                                ? ""
                                : reader.GetString(2),

                        IsDeleted =
                            reader.GetBoolean(3),

                        IsActive =
                            reader.GetBoolean(4),

                        ModifiedDate =
                            reader.GetDateTime(5)
                    }
                );
            }

            return users;
        }


        public async Task<int> AddUserAsync(
            User user)
        {
            const string sql = @"
                insert into users
                (
                    name,
                    email,
                    is_deleted,
                    is_active,
                    modified_date
                )
                values
                (
                    @name,
                    @email,
                    false,
                    true,
                    current_timestamp
                )
                returning id;
            ";

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "name",
                user.Name
            );

            command.Parameters.AddWithValue(
                "email",
                user.Email
            );

            var result =
                await command.ExecuteScalarAsync();

            return Convert.ToInt32(result);
        }


        public async Task<bool> UpdateUserAsync(
            int id,
            User user)
        {
            const string sql = @"
                update users
                set
                    name = @name,
                    email = @email,
                    is_active = @isActive,
                    modified_date = current_timestamp
                where id = @id
                  and is_deleted = false;
            ";

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "id",
                id
            );

            command.Parameters.AddWithValue(
                "name",
                user.Name
            );

            command.Parameters.AddWithValue(
                "email",
                user.Email
            );

            command.Parameters.AddWithValue(
                "isActive",
                user.IsActive
            );

            var affected =
                await command.ExecuteNonQueryAsync();

            return affected > 0;
        }


        public async Task<bool> SoftDeleteUserAsync(
            int id)
        {
            const string sql = @"
                update users
                set
                    is_deleted = true,
                    is_active = false,
                    modified_date = current_timestamp
                where id = @id
                  and is_deleted = false;
            ";

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "id",
                id
            );

            var affected =
                await command.ExecuteNonQueryAsync();

            return affected > 0;
        }


        // =========================================
        // ROLLER
        // =========================================

        public async Task<List<Role>> GetRolesAsync()
        {
            const string sql = @"
                select
                    id,
                    name,
                    description
                from roles
                where is_deleted = false
                  and is_active = true
                order by id;
            ";

            var roles =
                new List<Role>();

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            await using var reader =
                await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                roles.Add(
                    new Role
                    {
                        Id =
                            reader.GetInt32(0),

                        Name =
                            reader.GetString(1),

                        Description =
                            reader.IsDBNull(2)
                                ? ""
                                : reader.GetString(2)
                    }
                );
            }

            return roles;
        }


        public async Task<int> AddRoleAsync(
            Role role)
        {
            const string sql = @"
                insert into roles
                (
                    name,
                    description,
                    inserted_date,
                    modified_date,
                    is_deleted,
                    is_active
                )
                values
                (
                    @name,
                    @description,
                    current_timestamp,
                    current_timestamp,
                    false,
                    true
                )
                returning id;
            ";

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "name",
                role.Name
            );

            command.Parameters.AddWithValue(
                "description",
                role.Description ?? ""
            );

            var result =
                await command.ExecuteScalarAsync();

            return Convert.ToInt32(result);
        }


        public async Task<bool> UpdateRoleAsync(
            int id,
            Role role)
        {
            const string sql = @"
                update roles
                set
                    name = @name,
                    description = @description,
                    modified_date = current_timestamp
                where id = @id
                  and is_deleted = false;
            ";

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "id",
                id
            );

            command.Parameters.AddWithValue(
                "name",
                role.Name
            );

            command.Parameters.AddWithValue(
                "description",
                role.Description ?? ""
            );

            var affected =
                await command.ExecuteNonQueryAsync();

            return affected > 0;
        }


        public async Task<bool> SoftDeleteRoleAsync(
            int id)
        {
            const string sql = @"
                update roles
                set
                    is_deleted = true,
                    is_active = false,
                    modified_date = current_timestamp
                where id = @id
                  and is_deleted = false;
            ";

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "id",
                id
            );

            var affected =
                await command.ExecuteNonQueryAsync();

            return affected > 0;
        }


        // =========================================
        // PERMISSIONS
        // =========================================

        public async Task<List<Permission>>
            GetPermissionsAsync()
        {
            const string sql = @"
                select
                    id,
                    name,
                    description
                from permissions
                where is_deleted = false
                  and is_active = true
                order by id;
            ";

            var permissions =
                new List<Permission>();

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            await using var reader =
                await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                permissions.Add(
                    new Permission
                    {
                        Id =
                            reader.GetInt32(0),

                        Name =
                            reader.GetString(1),

                        Description =
                            reader.IsDBNull(2)
                                ? ""
                                : reader.GetString(2)
                    }
                );
            }

            return permissions;
        }


        // =========================================
        // ROLE PERMISSIONS
        // =========================================

        public async Task<List<int>>
            GetRolePermissionIdsAsync(
                int roleId)
        {
            const string sql = @"
                select rp.permission_id
                from role_permissions rp
                inner join permissions p
                    on p.id = rp.permission_id
                where rp.role_id = @roleId
                  and p.is_deleted = false
                  and p.is_active = true;
            ";

            var permissionIds =
                new List<int>();

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "roleId",
                roleId
            );

            await using var reader =
                await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                permissionIds.Add(
                    reader.GetInt32(0)
                );
            }

            return permissionIds;
        }


        public async Task SetRolePermissionsAsync(
            int roleId,
            List<int> permissionIds)
        {
            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var transaction =
                await connection
                    .BeginTransactionAsync();

            try
            {
                const string deleteSql = @"
                    delete from role_permissions
                    where role_id = @roleId;
                ";

                await using (
                    var deleteCommand =
                        new NpgsqlCommand(
                            deleteSql,
                            connection,
                            transaction
                        )
                )
                {
                    deleteCommand.Parameters
                        .AddWithValue(
                            "roleId",
                            roleId
                        );

                    await deleteCommand
                        .ExecuteNonQueryAsync();
                }


                const string insertSql = @"
                    insert into role_permissions
                    (
                        role_id,
                        permission_id
                    )
                    values
                    (
                        @roleId,
                        @permissionId
                    );
                ";

                foreach (
                    var permissionId
                    in permissionIds
                )
                {
                    await using var insertCommand =
                        new NpgsqlCommand(
                            insertSql,
                            connection,
                            transaction
                        );

                    insertCommand.Parameters
                        .AddWithValue(
                            "roleId",
                            roleId
                        );

                    insertCommand.Parameters
                        .AddWithValue(
                            "permissionId",
                            permissionId
                        );

                    await insertCommand
                        .ExecuteNonQueryAsync();
                }

                await transaction
                    .CommitAsync();
            }
            catch
            {
                await transaction
                    .RollbackAsync();

                throw;
            }
        }


        // =========================================
        // USER ROLES
        // =========================================

        public async Task<List<int>>
            GetUserRoleIdsAsync(
                int userId)
        {
            const string sql = @"
                select ur.role_id
                from user_roles ur
                inner join roles r
                    on r.id = ur.role_id
                where ur.user_id = @userId
                  and r.is_deleted = false
                  and r.is_active = true;
            ";

            var roleIds =
                new List<int>();

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "userId",
                userId
            );

            await using var reader =
                await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                roleIds.Add(
                    reader.GetInt32(0)
                );
            }

            return roleIds;
        }


        // =========================================
        // USER DIRECT PERMISSIONS
        // =========================================

        public async Task<List<int>>
            GetUserDirectPermissionIdsAsync(
                int userId)
        {
            const string sql = @"
                select up.permission_id
                from user_permissions up
                inner join permissions p
                    on p.id = up.permission_id
                where up.user_id = @userId
                  and p.is_deleted = false
                  and p.is_active = true;
            ";

            var permissionIds =
                new List<int>();

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "userId",
                userId
            );

            await using var reader =
                await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                permissionIds.Add(
                    reader.GetInt32(0)
                );
            }

            return permissionIds;
        }


        // =========================================
        // ROLE ÜZERİNDEN GELEN USER PERMISSIONS
        // =========================================

        public async Task<List<int>>
            GetUserRolePermissionIdsAsync(
                int userId)
        {
            const string sql = @"
                select distinct
                    rp.permission_id
                from user_roles ur
                inner join roles r
                    on r.id = ur.role_id
                inner join role_permissions rp
                    on rp.role_id = ur.role_id
                inner join permissions p
                    on p.id = rp.permission_id
                where ur.user_id = @userId
                  and r.is_deleted = false
                  and r.is_active = true
                  and p.is_deleted = false
                  and p.is_active = true;
            ";

            var permissionIds =
                new List<int>();

            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var command =
                new NpgsqlCommand(
                    sql,
                    connection
                );

            command.Parameters.AddWithValue(
                "userId",
                userId
            );

            await using var reader =
                await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                permissionIds.Add(
                    reader.GetInt32(0)
                );
            }

            return permissionIds;
        }


        // =========================================
        // USER AUTHORIZATION KAYDET
        // =========================================

        public async Task SetUserAuthorizationAsync(
            int userId,
            List<int> roleIds,
            List<int> directPermissionIds)
        {
            await using var connection =
                new NpgsqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();

            await using var transaction =
                await connection
                    .BeginTransactionAsync();

            try
            {
                // Önce eski rolleri temizle
                const string deleteRolesSql = @"
                    delete from user_roles
                    where user_id = @userId;
                ";

                await using (
                    var deleteRolesCommand =
                        new NpgsqlCommand(
                            deleteRolesSql,
                            connection,
                            transaction
                        )
                )
                {
                    deleteRolesCommand.Parameters
                        .AddWithValue(
                            "userId",
                            userId
                        );

                    await deleteRolesCommand
                        .ExecuteNonQueryAsync();
                }


                // Yeni rolleri ekle
                const string insertRoleSql = @"
                    insert into user_roles
                    (
                        user_id,
                        role_id
                    )
                    values
                    (
                        @userId,
                        @roleId
                    );
                ";

                foreach (var roleId in roleIds)
                {
                    await using var command =
                        new NpgsqlCommand(
                            insertRoleSql,
                            connection,
                            transaction
                        );

                    command.Parameters.AddWithValue(
                        "userId",
                        userId
                    );

                    command.Parameters.AddWithValue(
                        "roleId",
                        roleId
                    );

                    await command
                        .ExecuteNonQueryAsync();
                }


                // Eski direkt yetkileri temizle
                const string deletePermissionsSql = @"
                    delete from user_permissions
                    where user_id = @userId;
                ";

                await using (
                    var deletePermissionsCommand =
                        new NpgsqlCommand(
                            deletePermissionsSql,
                            connection,
                            transaction
                        )
                )
                {
                    deletePermissionsCommand.Parameters
                        .AddWithValue(
                            "userId",
                            userId
                        );

                    await deletePermissionsCommand
                        .ExecuteNonQueryAsync();
                }


                // Yeni direkt yetkileri ekle
                const string insertPermissionSql = @"
                    insert into user_permissions
                    (
                        user_id,
                        permission_id
                    )
                    values
                    (
                        @userId,
                        @permissionId
                    );
                ";

                foreach (
                    var permissionId
                    in directPermissionIds
                )
                {
                    await using var command =
                        new NpgsqlCommand(
                            insertPermissionSql,
                            connection,
                            transaction
                        );

                    command.Parameters.AddWithValue(
                        "userId",
                        userId
                    );

                    command.Parameters.AddWithValue(
                        "permissionId",
                        permissionId
                    );

                    await command
                        .ExecuteNonQueryAsync();
                }


                await transaction
                    .CommitAsync();
            }
            catch
            {
                await transaction
                    .RollbackAsync();

                throw;

        
            }
        }

        public async Task<bool> HasPermissionAsync(
    int userId,
    string permissionName)
{
    const string sql = @"
        select exists
        (
            select 1
            from user_permissions up
            inner join permissions p
                on p.id = up.permission_id
            where up.user_id = @userId
              and p.name = @permissionName
              and p.is_deleted = false
              and p.is_active = true

            union

            select 1
            from user_roles ur
            inner join roles r
                on r.id = ur.role_id
            inner join role_permissions rp
                on rp.role_id = r.id
            inner join permissions p
                on p.id = rp.permission_id
            where ur.user_id = @userId
              and p.name = @permissionName
              and r.is_deleted = false
              and r.is_active = true
              and p.is_deleted = false
              and p.is_active = true
        );
    ";

    await using var connection =
        new NpgsqlConnection(
            _connectionString
        );

    await connection.OpenAsync();

    await using var command =
        new NpgsqlCommand(
            sql,
            connection
        );

    command.Parameters.AddWithValue(
        "userId",
        userId
    );

    command.Parameters.AddWithValue(
        "permissionName",
        permissionName
    );

    var result =
        await command.ExecuteScalarAsync();

    return Convert.ToBoolean(result);
}


public async Task<bool> HasRoleAsync(
    int userId,
    string roleName)
{
    const string sql = @"
        select exists
        (
            select 1
            from user_roles ur
            inner join roles r
                on r.id = ur.role_id
            where ur.user_id = @userId
              and r.name = @roleName
              and r.is_deleted = false
              and r.is_active = true
        );
    ";

    await using var connection =
        new NpgsqlConnection(
            _connectionString
        );

    await connection.OpenAsync();

    await using var command =
        new NpgsqlCommand(
            sql,
            connection
        );

    command.Parameters.AddWithValue(
        "userId",
        userId
    );

    command.Parameters.AddWithValue(
        "roleName",
        roleName
    );

    var result =
        await command.ExecuteScalarAsync();

    return Convert.ToBoolean(result);
}
    }
}