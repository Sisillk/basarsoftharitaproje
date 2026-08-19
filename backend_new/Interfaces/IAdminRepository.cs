using backend_new.Models;

namespace backend_new.Interfaces
{
    public interface IAdminRepository
    {
        // =========================================
        // KULLANICILAR
        // =========================================

        Task<List<User>> GetUsersAsync();

        Task<int> AddUserAsync(
            User user,
            string passwordHash
        );

        Task<bool> UpdateUserAsync(
            int id,
            User user,
            string? passwordHash
        );

        Task<bool> SoftDeleteUserAsync(
            int id
        );

        Task<AuthUser?> GetAuthUserByUsernameAsync(
            string username
        );

        Task<bool> UsernameExistsAsync(
            string username,
            int excludeUserId
        );


        // =========================================
        // ROLLER
        // =========================================

        Task<List<Role>> GetRolesAsync();

        Task<int> AddRoleAsync(
            Role role
        );

        Task<bool> UpdateRoleAsync(
            int id,
            Role role
        );

        Task<bool> SoftDeleteRoleAsync(
            int id
        );


        // =========================================
        // PERMISSIONS
        // =========================================

        Task<List<Permission>>
            GetPermissionsAsync();


        // =========================================
        // ROLE PERMISSIONS
        // =========================================

        Task<List<int>>
            GetRolePermissionIdsAsync(
                int roleId
            );

        Task SetRolePermissionsAsync(
            int roleId,
            List<int> permissionIds
        );


        // =========================================
        // USER ROLES
        // =========================================

        Task<List<int>>
            GetUserRoleIdsAsync(
                int userId
            );


        // =========================================
        // DIRECT USER PERMISSIONS
        // =========================================

        Task<List<int>>
            GetUserDirectPermissionIdsAsync(
                int userId
            );


        // =========================================
        // ROLE ÜZERİNDEN GELEN USER PERMISSIONS
        // =========================================

        Task<List<int>>
            GetUserRolePermissionIdsAsync(
                int userId
            );


        // =========================================
        // USER AUTHORIZATION
        // =========================================

        Task SetUserAuthorizationAsync(
            int userId,
            List<int> roleIds,
            List<int> directPermissionIds
        );


        // =========================================
        // YETKİ KONTROLLERİ
        // =========================================

        Task<bool> HasPermissionAsync(
            int userId,
            string permissionName
        );

        Task<bool> HasRoleAsync(
            int userId,
            string roleName
        );


        // =========================================
        // COĞRAFİ YETKİLER
        // =========================================

        Task<string?> GetUserGeoAuthorizationWktAsync(
            int userId
        );

        Task SetUserGeoAuthorizationAsync(
            int userId,
            string wkt
        );

        Task ClearUserGeoAuthorizationAsync(
            int userId
        );


        Task<string?> GetRoleGeoAuthorizationWktAsync(
            int roleId
        );

        Task SetRoleGeoAuthorizationAsync(
            int roleId,
            string wkt
        );

        Task ClearRoleGeoAuthorizationAsync(
            int roleId
        );


       
        Task<string?> GetEffectiveGeoAuthorizationWktAsync(
            int userId
        );


    
        Task<bool> IsGeometryAllowedAsync(
            int userId,
            string wkt
        );
    }
}