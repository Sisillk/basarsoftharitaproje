using backend_new.Interfaces;
using backend_new.Models;

namespace backend_new.Services
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _adminRepository;
        private readonly IPasswordService _passwordService;

        public AdminService(
            IAdminRepository adminRepository,
            IPasswordService passwordService)
        {
            _adminRepository = adminRepository;
            _passwordService = passwordService;
        }


        // =========================================
        // KULLANICILAR
        // =========================================

        public async Task<List<User>> GetUsersAsync()
        {
            return await _adminRepository
                .GetUsersAsync();
        }


        public async Task<int> AddUserAsync(
            AdminUserRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ArgumentException(
                    "Kullanıcı adı boş olamaz."
                );
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                throw new ArgumentException(
                    "E-posta boş olamaz."
                );
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                throw new ArgumentException(
                    "Giriş kullanıcı adı boş olamaz."
                );
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ArgumentException(
                    "Şifre boş olamaz."
                );
            }


            string username =
                request.Username.Trim();


            bool usernameExists =
                await _adminRepository
                    .UsernameExistsAsync(
                        username,
                        0
                    );

            if (usernameExists)
            {
                throw new ArgumentException(
                    "Bu kullanıcı adı zaten kullanılıyor."
                );
            }


            string passwordHash =
                _passwordService
                    .HashPassword(
                        request.Password
                    );


            var user =
                new User
                {
                    Name =
                        request.Name.Trim(),

                    Email =
                        request.Email.Trim(),

                    Username =
                        username,

                    IsActive =
                        request.IsActive,

                    IsDeleted =
                        false,

                    ModifiedDate =
                        DateTime.Now
                };


            return await _adminRepository
                .AddUserAsync(
                    user,
                    passwordHash
                );
        }


        public async Task<bool> UpdateUserAsync(
            int id,
            AdminUserRequest request)
        {
            ValidateId(id);


            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ArgumentException(
                    "Kullanıcı adı boş olamaz."
                );
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                throw new ArgumentException(
                    "E-posta boş olamaz."
                );
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                throw new ArgumentException(
                    "Giriş kullanıcı adı boş olamaz."
                );
            }


            string username =
                request.Username.Trim();


            bool usernameExists =
                await _adminRepository
                    .UsernameExistsAsync(
                        username,
                        id
                    );

            if (usernameExists)
            {
                throw new ArgumentException(
                    "Bu kullanıcı adı zaten kullanılıyor."
                );
            }


            string? passwordHash =
                null;


            // Güncelleme sırasında şifre boş bırakılırsa
            // mevcut şifre korunur.
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                passwordHash =
                    _passwordService
                        .HashPassword(
                            request.Password
                        );
            }


            var user =
                new User
                {
                    Id =
                        id,

                    Name =
                        request.Name.Trim(),

                    Email =
                        request.Email.Trim(),

                    Username =
                        username,

                    IsActive =
                        request.IsActive
                };


            return await _adminRepository
                .UpdateUserAsync(
                    id,
                    user,
                    passwordHash
                );
        }


        public async Task<bool> SoftDeleteUserAsync(
            int id)
        {
            ValidateId(id);

            return await _adminRepository
                .SoftDeleteUserAsync(id);
        }


        public async Task<AuthUser?>
            GetAuthUserByUsernameAsync(
                string username)
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                return null;
            }

            return await _adminRepository
                .GetAuthUserByUsernameAsync(
                    username.Trim()
                );
        }


        // =========================================
        // ROLLER
        // =========================================

        public async Task<List<Role>> GetRolesAsync()
        {
            return await _adminRepository
                .GetRolesAsync();
        }


        public async Task<int> AddRoleAsync(
            Role role)
        {
            if (string.IsNullOrWhiteSpace(role.Name))
            {
                throw new ArgumentException(
                    "Rol adı boş olamaz."
                );
            }

            return await _adminRepository
                .AddRoleAsync(role);
        }


        public async Task<bool> UpdateRoleAsync(
            int id,
            Role role)
        {
            ValidateId(id);

            if (string.IsNullOrWhiteSpace(role.Name))
            {
                throw new ArgumentException(
                    "Rol adı boş olamaz."
                );
            }

            return await _adminRepository
                .UpdateRoleAsync(
                    id,
                    role
                );
        }


        public async Task<bool> SoftDeleteRoleAsync(
            int id)
        {
            ValidateId(id);

            return await _adminRepository
                .SoftDeleteRoleAsync(id);
        }


        // =========================================
        // PERMISSIONS
        // =========================================

        public async Task<List<Permission>>
            GetPermissionsAsync()
        {
            return await _adminRepository
                .GetPermissionsAsync();
        }


        // =========================================
        // ROLE PERMISSIONS
        // =========================================

        public async Task<List<int>>
            GetRolePermissionIdsAsync(
                int roleId)
        {
            ValidateId(roleId);

            return await _adminRepository
                .GetRolePermissionIdsAsync(
                    roleId
                );
        }


        public async Task SetRolePermissionsAsync(
            int roleId,
            List<int> permissionIds)
        {
            ValidateId(roleId);

            permissionIds ??=
                new List<int>();

            permissionIds =
                permissionIds
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();

            await _adminRepository
                .SetRolePermissionsAsync(
                    roleId,
                    permissionIds
                );
        }


        // =========================================
        // USER ROLES
        // =========================================

        public async Task<List<int>>
            GetUserRoleIdsAsync(
                int userId)
        {
            ValidateId(userId);

            return await _adminRepository
                .GetUserRoleIdsAsync(
                    userId
                );
        }


        // =========================================
        // DIRECT USER PERMISSIONS
        // =========================================

        public async Task<List<int>>
            GetUserDirectPermissionIdsAsync(
                int userId)
        {
            ValidateId(userId);

            return await _adminRepository
                .GetUserDirectPermissionIdsAsync(
                    userId
                );
        }


        // =========================================
        // ROLDEN GELEN PERMISSIONS
        // =========================================

        public async Task<List<int>>
            GetUserRolePermissionIdsAsync(
                int userId)
        {
            ValidateId(userId);

            return await _adminRepository
                .GetUserRolePermissionIdsAsync(
                    userId
                );
        }


        // =========================================
        // USER AUTHORIZATION
        // =========================================

        public async Task SetUserAuthorizationAsync(
            int userId,
            List<int> roleIds,
            List<int> directPermissionIds)
        {
            ValidateId(userId);

            roleIds ??=
                new List<int>();

            directPermissionIds ??=
                new List<int>();


            roleIds =
                roleIds
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();


            directPermissionIds =
                directPermissionIds
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();


            var rolePermissionIds =
                new HashSet<int>();


            foreach (var roleId in roleIds)
            {
                var permissions =
                    await _adminRepository
                        .GetRolePermissionIdsAsync(
                            roleId
                        );

                foreach (
                    var permissionId
                    in permissions)
                {
                    rolePermissionIds.Add(
                        permissionId
                    );
                }
            }


            var filteredDirectPermissions =
                directPermissionIds
                    .Where(
                        permissionId =>
                            !rolePermissionIds
                                .Contains(
                                    permissionId
                                )
                    )
                    .ToList();


            await _adminRepository
                .SetUserAuthorizationAsync(
                    userId,
                    roleIds,
                    filteredDirectPermissions
                );
        }


       
        // PERMISSION CONTROL
  

        public async Task<bool> HasPermissionAsync(
            int userId,
            string permissionName)
        {
            ValidateId(userId);

            if (string.IsNullOrWhiteSpace(permissionName))
            {
                throw new ArgumentException(
                    "Yetki adı boş olamaz."
                );
            }

            return await _adminRepository
                .HasPermissionAsync(
                    userId,
                    permissionName
                );
        }


        // ROLE CONTROL
      

        public async Task<bool> HasRoleAsync(
            int userId,
            string roleName)
        {
            ValidateId(userId);

            if (string.IsNullOrWhiteSpace(roleName))
            {
                throw new ArgumentException(
                    "Rol adı boş olamaz."
                );
            }

            return await _adminRepository
                .HasRoleAsync(
                    userId,
                    roleName
                );
        }


// =========================================
// COĞRAFİ YETKİLER
// =========================================

public async Task<string?>
    GetUserGeoAuthorizationWktAsync(
        int userId)
{
    ValidateId(userId);

    return await _adminRepository
        .GetUserGeoAuthorizationWktAsync(
            userId
        );
}


public async Task SetUserGeoAuthorizationAsync(
    int userId,
    string wkt)
{
    ValidateId(userId);

    if (string.IsNullOrWhiteSpace(wkt))
    {
        throw new ArgumentException(
            "Coğrafi yetki alanı boş olamaz."
        );
    }

    await _adminRepository
        .SetUserGeoAuthorizationAsync(
            userId,
            wkt
        );
}


public async Task ClearUserGeoAuthorizationAsync(
    int userId)
{
    ValidateId(userId);

    await _adminRepository
        .ClearUserGeoAuthorizationAsync(
            userId
        );
}


public async Task<string?>
    GetRoleGeoAuthorizationWktAsync(
        int roleId)
{
    ValidateId(roleId);

    return await _adminRepository
        .GetRoleGeoAuthorizationWktAsync(
            roleId
        );
}


public async Task SetRoleGeoAuthorizationAsync(
    int roleId,
    string wkt)
{
    ValidateId(roleId);

    if (string.IsNullOrWhiteSpace(wkt))
    {
        throw new ArgumentException(
            "Coğrafi yetki alanı boş olamaz."
        );
    }

    await _adminRepository
        .SetRoleGeoAuthorizationAsync(
            roleId,
            wkt
        );
}


public async Task ClearRoleGeoAuthorizationAsync(
    int roleId)
{
    ValidateId(roleId);

    await _adminRepository
        .ClearRoleGeoAuthorizationAsync(
            roleId
        );
}


public async Task<string?>
    GetEffectiveGeoAuthorizationWktAsync(
        int userId)
{
    ValidateId(userId);

    return await _adminRepository
        .GetEffectiveGeoAuthorizationWktAsync(
            userId
        );
}


public async Task<bool> IsGeometryAllowedAsync(
    int userId,
    string wkt)
{
    ValidateId(userId);

    if (string.IsNullOrWhiteSpace(wkt))
    {
        throw new ArgumentException(
            "Geometri boş olamaz."
        );
    }

    return await _adminRepository
        .IsGeometryAllowedAsync(
            userId,
            wkt
        );
}

        // VALIDATION
       

        private static void ValidateId(
            int id)
        {
            if (id <= 0)
            {
                throw new ArgumentException(
                    "Geçersiz ID."
                );
            }
        }
    }
}