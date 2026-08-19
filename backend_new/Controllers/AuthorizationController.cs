using backend_new.Interfaces;
using backend_new.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend_new.Controllers
{
    [ApiController]
    [Route("api/authorization")]
    [Authorize]
    public class AuthorizationController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AuthorizationController(
            IAdminService adminService)
        {
            _adminService = adminService;
        }


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


        [HttpGet("me")]
        public async Task<IActionResult> GetMyAuthorization()
        {
            try
            {
                int userId =
                    GetCurrentUserId();

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

                var allPermissions =
                    await _adminService
                        .GetPermissionsAsync();

                var allRoles =
                    await _adminService
                        .GetRolesAsync();

                var geoAuthorizationWkt =
                    await _adminService
                        .GetEffectiveGeoAuthorizationWktAsync(
                            userId
                        );


                var effectivePermissionIds =
                    directPermissionIds
                        .Union(
                            rolePermissionIds
                        )
                        .Distinct()
                        .ToList();


                var permissionNames =
                    allPermissions
                        .Where(
                            p =>
                                effectivePermissionIds
                                    .Contains(p.Id)
                        )
                        .Select(p => p.Name)
                        .ToList();


                var roleNames =
                    allRoles
                        .Where(
                            r =>
                                roleIds.Contains(
                                    r.Id
                                )
                        )
                        .Select(r => r.Name)
                        .ToList();


                bool isAdmin =
                    roleNames.Contains(
                        "Admin"
                    );


                return Ok(new
                {
                    userId,
                    roleNames,
                    permissionNames,
                    isAdmin,
                    geoAuthorizationWkt
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Yetki bilgileri alınırken hata oluştu.",

                        detail =
                            ex.Message
                    }
                );
            }
        }


        // =====================================
        // GEOMETRY AUTHORIZATION CHECK
        // =====================================

        [HttpPost("check-geometry")]
        public async Task<IActionResult> CheckGeometry(
            GeoAuthorizationRequest request)
        {
            try
            {
                int userId =
                    GetCurrentUserId();

                bool allowed =
                    await _adminService
                        .IsGeometryAllowedAsync(
                            userId,
                            request.Wkt
                        );

                return Ok(new
                {
                    allowed
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    message = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Coğrafi yetki kontrolü sırasında hata oluştu.",

                        detail =
                            ex.Message
                    }
                );
            }
        }
    }
}
