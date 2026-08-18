using backend_new.Interfaces;
using backend_new.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend_new.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GeometryController : ControllerBase
    {
        private readonly IGeometryService _geometryService;
        private readonly IAdminService _adminService;

        public GeometryController(
            IGeometryService geometryService,
            IAdminService adminService)
        {
            _geometryService = geometryService;
            _adminService = adminService;
        }


        // =====================================
        // CURRENT USER
        // =====================================

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst("user_id");

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
        // PERMISSION CONTROL
        // =====================================

        private async Task<bool> HasPermission(
            int userId,
            string permissionName)
        {
            return await _adminService
                .HasPermissionAsync(
                    userId,
                    permissionName
                );
        }


        // =====================================
        // POINT
        // =====================================

        [HttpPost("point")]
        public async Task<IActionResult> AddPoint(
            GeometryRequest request)
        {
            try
            {
                int userId = GetCurrentUserId();

                if (
                    !await HasPermission(
                        userId,
                        "Point Ekleme"
                    )
                )
                {
                    return StatusCode(
                        403,
                        new
                        {
                            message =
                                "Point ekleme yetkiniz bulunmuyor."
                        }
                    );
                }

                int id =
                    await _geometryService
                        .AddPointAsync(
                            request.Wkt,
                            request.Name,
                            request.Color,
                            userId
                        );

                return Ok(new
                {
                    id,
                    message =
                        "Point kaydedildi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // LINE
        // =====================================

        [HttpPost("line")]
        public async Task<IActionResult> AddLine(
            GeometryRequest request)
        {
            try
            {
                int userId = GetCurrentUserId();

                if (
                    !await HasPermission(
                        userId,
                        "Line Ekleme"
                    )
                )
                {
                    return StatusCode(
                        403,
                        new
                        {
                            message =
                                "Line ekleme yetkiniz bulunmuyor."
                        }
                    );
                }

                int id =
                    await _geometryService
                        .AddLineAsync(
                            request.Wkt,
                            request.Name,
                            request.Color,
                            userId
                        );

                return Ok(new
                {
                    id,
                    message =
                        "Line kaydedildi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // POLYGON
        // =====================================

        [HttpPost("polygon")]
        public async Task<IActionResult> AddPolygon(
            GeometryRequest request)
        {
            try
            {
                int userId = GetCurrentUserId();

                if (
                    !await HasPermission(
                        userId,
                        "Polygon Ekleme"
                    )
                )
                {
                    return StatusCode(
                        403,
                        new
                        {
                            message =
                                "Polygon ekleme yetkiniz bulunmuyor."
                        }
                    );
                }

                int id =
                    await _geometryService
                        .AddPolygonAsync(
                            request.Wkt,
                            request.Name,
                            request.Color,
                            userId
                        );

                return Ok(new
                {
                    id,
                    message =
                        "Polygon kaydedildi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // GET USER GEOMETRIES
        // =====================================

        [HttpGet("all")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                int userId = GetCurrentUserId();

                var points =
                    await _geometryService
                        .GetPointsAsync(userId);

                var lines =
                    await _geometryService
                        .GetLinesAsync(userId);

                var polygons =
                    await _geometryService
                        .GetPolygonsAsync(userId);

                return Ok(new
                {
                    points,
                    lines,
                    polygons
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // INVENTORY ANALYSIS
        // =====================================

        [HttpPost("inventory-count")]
        public async Task<IActionResult>
            GetInventoryCount(
                GeometryRequest request)
        {
            try
            {
                int userId = GetCurrentUserId();

                if (
                    !await HasPermission(
                        userId,
                        "Envanter Analizi"
                    )
                )
                {
                    return StatusCode(
                        403,
                        new
                        {
                            message =
                                "Envanter analizi yetkiniz bulunmuyor."
                        }
                    );
                }

                var count =
                    await _geometryService
                        .GetIntersectingInventoryCountAsync(
                            request.Wkt
                        );

                return Ok(new
                {
                    count
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // UPDATE
        // =====================================

        [HttpPut("{type}/{id:int}")]
        public async Task<IActionResult> Update(
            string type,
            int id,
            GeometryRequest request)
        {
            try
            {
                int userId = GetCurrentUserId();

                if (
                    !await HasPermission(
                        userId,
                        "Obje Güncelleme"
                    )
                )
                {
                    return StatusCode(
                        403,
                        new
                        {
                            message =
                                "Obje güncelleme yetkiniz bulunmuyor."
                        }
                    );
                }

                bool updated =
                    await _geometryService
                        .UpdateGeometryAsync(
                            type,
                            id,
                            request.Wkt,
                            request.Name,
                            request.Color,
                            userId
                        );

                if (!updated)
                {
                    return NotFound(new
                    {
                        message =
                            "Güncellenecek obje bulunamadı."
                    });
                }

                return Ok(new
                {
                    message =
                        "Obje başarıyla güncellendi."
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }


        // =====================================
        // SOFT DELETE
        // =====================================

        [HttpDelete("{type}/{id:int}")]
        public async Task<IActionResult> Delete(
            string type,
            int id)
        {
            try
            {
                int userId = GetCurrentUserId();

                if (
                    !await HasPermission(
                        userId,
                        "Obje Silme"
                    )
                )
                {
                    return StatusCode(
                        403,
                        new
                        {
                            message =
                                "Obje silme yetkiniz bulunmuyor."
                        }
                    );
                }

                bool deleted =
                    await _geometryService
                        .SoftDeleteGeometryAsync(
                            type,
                            id,
                            userId
                        );

                if (!deleted)
                {
                    return NotFound(new
                    {
                        message =
                            "Silinecek obje bulunamadı."
                    });
                }

                return Ok(new
                {
                    message =
                        "Obje başarıyla silindi."
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