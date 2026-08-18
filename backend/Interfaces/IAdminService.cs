using backend_new.Models;

namespace backend_new.Interfaces
{
    public interface IAdminService
    {
        Task<List<User>> GetUsersAsync();

        Task<int> AddUserAsync(
            User user
        );

        Task<bool> UpdateUserAsync(
            int id,
            User user
        );

        Task<bool> SoftDeleteUserAsync(
            int id
        );


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


      
        Task<List<Permission>>
            GetPermissionsAsync();


        Task<List<int>>
            GetRolePermissionIdsAsync(
                int roleId
            );

        Task SetRolePermissionsAsync(
            int roleId,
            List<int> permissionIds
        );


        Task<List<int>>
            GetUserRoleIdsAsync(
                int userId
            );


        Task<List<int>>
            GetUserDirectPermissionIdsAsync(
                int userId
            );


        Task<List<int>>
            GetUserRolePermissionIdsAsync(
                int userId
            );


        Task SetUserAuthorizationAsync(
            int userId,
            List<int> roleIds,
            List<int> directPermissionIds
        );


        Task<bool> HasPermissionAsync(
    int userId,
    string permissionName
);

Task<bool> HasRoleAsync(
    int userId,
    string roleName
);
    }
}