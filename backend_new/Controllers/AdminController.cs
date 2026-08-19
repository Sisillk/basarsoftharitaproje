using backend_new.Interfaces;
using backend_new.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend_new.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(
            IAdminService adminService)
        {
            _adminService = adminService;
        }


        // =====================================
        // CURRENT USER
        // =====================================

        private int GetCurrentUserId()
        {
            var claim =
                User.FindFirst("user_id");

            if (
                claim == null ||
                !int.TryParse(
                    claim.Value,
                    out int userId
                )
            )
            {
                throw new UnauthorizedAccessException(
                    "Kullanıcı bilgisi bulunamadı."
                );
            }

            return userId;
        }


        // =====================================
        // ADMIN CONTROL
        // =====================================

        private async Task<IActionResult?>
            CheckAdminAccessAsync()
        {
            int userId =
                GetCurrentUserId();

            bool isAdmin =
                await _adminService
                    .HasRoleAsync(
                        userId,
                        "Admin"
                    );

            if (!isAdmin)
            {
                return StatusCode(
                    403,
                    new
                    {
                        message =
                            "Bu işlem için Admin yetkisi gereklidir."
                    }
                );
            }

            return null;
        }


        // =====================================
        // USERS
        // =====================================

        [HttpGet("users")]
        public async Task<IActionResult>
            GetUsers()
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                var users =
                    await _adminService
                        .GetUsersAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpPost("users")]
        public async Task<IActionResult>
            AddUser(AdminUserRequest request)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                int id =
                    await _adminService
                        .AddUserAsync(request);

                return Ok(new
                {
                    id,
                    message =
                        "Kullanıcı başarıyla eklendi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpPut("users/{id:int}")]
        public async Task<IActionResult>
            UpdateUser(
                int id,
                AdminUserRequest request)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                bool updated =
                    await _adminService
                        .UpdateUserAsync(
                            id,
                            request
                        );

                if (!updated)
                {
                    return NotFound(new
                    {
                        message =
                            "Kullanıcı bulunamadı."
                    });
                }

                return Ok(new
                {
                    message =
                        "Kullanıcı güncellendi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpDelete("users/{id:int}")]
        public async Task<IActionResult>
            DeleteUser(int id)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                bool deleted =
                    await _adminService
                        .SoftDeleteUserAsync(
                            id
                        );

                if (!deleted)
                {
                    return NotFound(new
                    {
                        message =
                            "Kullanıcı bulunamadı."
                    });
                }

                return Ok(new
                {
                    message =
                        "Kullanıcı silindi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // ROLES
        // =====================================

        [HttpGet("roles")]
        public async Task<IActionResult>
            GetRoles()
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                var roles =
                    await _adminService
                        .GetRolesAsync();

                return Ok(roles);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpPost("roles")]
        public async Task<IActionResult>
            AddRole(Role role)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                int id =
                    await _adminService
                        .AddRoleAsync(role);

                return Ok(new
                {
                    id,
                    message =
                        "Rol başarıyla eklendi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpPut("roles/{id:int}")]
        public async Task<IActionResult>
            UpdateRole(
                int id,
                Role role)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                bool updated =
                    await _adminService
                        .UpdateRoleAsync(
                            id,
                            role
                        );

                if (!updated)
                {
                    return NotFound(new
                    {
                        message =
                            "Rol bulunamadı."
                    });
                }

                return Ok(new
                {
                    message =
                        "Rol güncellendi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpDelete("roles/{id:int}")]
        public async Task<IActionResult>
            DeleteRole(int id)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                bool deleted =
                    await _adminService
                        .SoftDeleteRoleAsync(
                            id
                        );

                if (!deleted)
                {
                    return NotFound(new
                    {
                        message =
                            "Rol bulunamadı."
                    });
                }

                return Ok(new
                {
                    message =
                        "Rol silindi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // PERMISSIONS
        // =====================================

        [HttpGet("permissions")]
        public async Task<IActionResult>
            GetPermissions()
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                var permissions =
                    await _adminService
                        .GetPermissionsAsync();

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // ROLE PERMISSIONS
        // =====================================

        [HttpGet(
            "roles/{roleId:int}/permissions"
        )]
        public async Task<IActionResult>
            GetRolePermissions(
                int roleId)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                var permissionIds =
                    await _adminService
                        .GetRolePermissionIdsAsync(
                            roleId
                        );

                return Ok(new
                {
                    permissionIds
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpPut(
            "roles/{roleId:int}/permissions"
        )]
        public async Task<IActionResult>
            SetRolePermissions(
                int roleId,
                RolePermissionRequest request)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                await _adminService
                    .SetRolePermissionsAsync(
                        roleId,
                        request.PermissionIds
                    );

                return Ok(new
                {
                    message =
                        "Rol yetkileri güncellendi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // USER AUTHORIZATION
        // =====================================

        [HttpGet(
            "users/{userId:int}/authorization"
        )]
        public async Task<IActionResult>
            GetUserAuthorization(
                int userId)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                var roleIds =
                    await _adminService
                        .GetUserRoleIdsAsync(
                            userId
                        );

                var directPermissionIds =
                    await _adminService
                        .GetUserDirectPermissionIdsAsync(
                            userId
                        );

                var rolePermissionIds =
                    await _adminService
                        .GetUserRolePermissionIdsAsync(
                            userId
                        );

                return Ok(new
                {
                    roleIds,
                    directPermissionIds,
                    rolePermissionIds
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpPut(
            "users/{userId:int}/authorization"
        )]
        public async Task<IActionResult>
            SetUserAuthorization(
                int userId,
                UserAuthorizationRequest request)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                await _adminService
                    .SetUserAuthorizationAsync(
                        userId,
                        request.RoleIds,
                        request.DirectPermissionIds
                    );

                return Ok(new
                {
                    message =
                        "Kullanıcı rol ve yetkileri güncellendi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        // =====================================
        // USER GEO AUTHORIZATION
        // =====================================

        [HttpGet(
            "users/{userId:int}/geo"
        )]
        public async Task<IActionResult>
            GetUserGeoAuthorization(
                int userId)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                var wkt =
                    await _adminService
                        .GetUserGeoAuthorizationWktAsync(
                            userId
                        );

                return Ok(new
                {
                    wkt
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpPut(
            "users/{userId:int}/geo"
        )]
        public async Task<IActionResult>
            SetUserGeoAuthorization(
                int userId,
                GeoAuthorizationRequest request)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                await _adminService
                    .SetUserGeoAuthorizationAsync(
                        userId,
                        request.Wkt
                    );

                return Ok(new
                {
                    message =
                        "Kullanıcı coğrafi yetkisi kaydedildi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpDelete(
            "users/{userId:int}/geo"
        )]
        public async Task<IActionResult>
            ClearUserGeoAuthorization(
                int userId)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                await _adminService
                    .ClearUserGeoAuthorizationAsync(
                        userId
                    );

                return Ok(new
                {
                    message =
                        "Kullanıcı coğrafi yetkisi kaldırıldı."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // ROLE GEO AUTHORIZATION
        // =====================================

        [HttpGet(
            "roles/{roleId:int}/geo"
        )]
        public async Task<IActionResult>
            GetRoleGeoAuthorization(
                int roleId)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                var wkt =
                    await _adminService
                        .GetRoleGeoAuthorizationWktAsync(
                            roleId
                        );

                return Ok(new
                {
                    wkt
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpPut(
            "roles/{roleId:int}/geo"
        )]
        public async Task<IActionResult>
            SetRoleGeoAuthorization(
                int roleId,
                GeoAuthorizationRequest request)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                await _adminService
                    .SetRoleGeoAuthorizationAsync(
                        roleId,
                        request.Wkt
                    );

                return Ok(new
                {
                    message =
                        "Rol coğrafi yetkisi kaydedildi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        [HttpDelete(
            "roles/{roleId:int}/geo"
        )]
        public async Task<IActionResult>
            ClearRoleGeoAuthorization(
                int roleId)
        {
            try
            {
                var denied =
                    await CheckAdminAccessAsync();

                if (denied != null)
                {
                    return denied;
                }

                await _adminService
                    .ClearRoleGeoAuthorizationAsync(
                        roleId
                    );

                return Ok(new
                {
                    message =
                        "Rol coğrafi yetkisi kaldırıldı."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        // =====================================
        // ERROR HANDLING
        // =====================================

        private IActionResult HandleException(
            Exception ex)
        {
            if (
                ex is UnauthorizedAccessException
            )
            {
                return Unauthorized(new
                {
                    message = ex.Message
                });
            }

            if (ex is ArgumentException)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }

            return StatusCode(
                500,
                new
                {
                    message =
                        "İşlem sırasında beklenmeyen bir hata oluştu.",

                    detail =
                        ex.Message
                }
            );
        }
    }
}