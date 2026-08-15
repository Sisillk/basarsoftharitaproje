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

        public GeometryController(IGeometryService geometryService)
        {
            _geometryService = geometryService;
        }

        [HttpPost("point")]
        public async Task<IActionResult> AddPoint(GeometryRequest request)
        {
            await _geometryService.AddPointAsync(
                request.Wkt,
                request.Name,
                request.Color
            );

            return Ok(new { message = "Point kaydedildi." });
        }

        [HttpPost("line")]
        public async Task<IActionResult> AddLine(GeometryRequest request)
        {
            await _geometryService.AddLineAsync(
                request.Wkt,
                request.Name,
                request.Color
            );

            return Ok(new { message = "Line kaydedildi." });
        }

        [HttpPost("polygon")]
        public async Task<IActionResult> AddPolygon(GeometryRequest request)
        {
            await _geometryService.AddPolygonAsync(
                request.Wkt,
                request.Name,
                request.Color
            );

            return Ok(new { message = "Polygon kaydedildi." });
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAll()
        {
            var points = await _geometryService.GetPointsAsync();
            var lines = await _geometryService.GetLinesAsync();
            var polygons = await _geometryService.GetPolygonsAsync();

            return Ok(new
            {
                points,
                lines,
                polygons
            });
        }

        [HttpPost("inventory-count")]
        public async Task<IActionResult> GetInventoryCount(
            GeometryRequest request)
        {
            var count =
                await _geometryService
                    .GetIntersectingInventoryCountAsync(request.Wkt);

            return Ok(new
            {
                count
            });
        }
    }
}
