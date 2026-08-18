using backend_new.Interfaces;
using backend_new.Models;

namespace backend_new.Services
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _adminRepository;

        public AdminService(
            IAdminRepository adminRepository)
        {
            _adminRepository = adminRepository;
        }


        // KULLANICILAR
        

        public async Task<List<User>> GetUsersAsync()
        {
            return await _adminRepository
                .GetUsersAsync();
        }

        public async Task<int> AddUserAsync(
            User user)
        {
            if (string.IsNullOrWhiteSpace(user.Name))
            {
                throw new ArgumentException(
                    "Kullanıcı adı boş olamaz."
                );
            }

            if (string.IsNullOrWhiteSpace(user.Email))
            {
                throw new ArgumentException(
                    "E-posta boş olamaz."
                );
            }

            return await _adminRepository
                .AddUserAsync(user);
        }

        public async Task<bool> UpdateUserAsync(
            int id,
            User user)
        {
            ValidateId(id);

            if (string.IsNullOrWhiteSpace(user.Name))
            {
                throw new ArgumentException(
                    "Kullanıcı adı boş olamaz."
                );
            }

            if (string.IsNullOrWhiteSpace(user.Email))
            {
                throw new ArgumentException(
                    "E-posta boş olamaz."
                );
            }

            return await _adminRepository
                .UpdateUserAsync(
                    id,
                    user
                );
        }

        public async Task<bool> SoftDeleteUserAsync(
            int id)
        {
            ValidateId(id);

            return await _adminRepository
                .SoftDeleteUserAsync(id);
        }


        // ROLLER
      

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


       
        // PERMISSIONS
       

        public async Task<List<Permission>>
            GetPermissionsAsync()
        {
            return await _adminRepository
                .GetPermissionsAsync();
        }


        
        // ROLE PERMISSIONS
    

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

            permissionIds ??= new List<int>();

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


       
        // USER ROLES
      

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


        // DIRECT USER PERMISSIONS
        

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


        // ROLEDEN GELEN PERMISSIONS
       

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


       
        // USER AUTHORIZATION
       

        public async Task SetUserAuthorizationAsync(
            int userId,
            List<int> roleIds,
            List<int> directPermissionIds)
        {
            ValidateId(userId);

            roleIds ??= new List<int>();

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


            // Seçilen rollerden gelen tüm yetkileri bul
            var rolePermissionIds =
                new HashSet<int>();

            foreach (var roleId in roleIds)
            {
                var permissions =
                    await _adminRepository
                        .GetRolePermissionIdsAsync(
                            roleId
                        );

                foreach (var permissionId in permissions)
                {
                    rolePermissionIds.Add(
                        permissionId
                    );
                }
            }


            // Rolde zaten bulunan permission
            // kullanıcıya tekrar direkt atanmasın
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
