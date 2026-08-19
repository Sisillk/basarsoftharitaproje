using backend_new.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend_new.Controllers
{
    [ApiController]
    [Route("api/geoserver")]
    public class GeoServerController : ControllerBase
    {
        private readonly GeoServerService _geoServerService;

        public GeoServerController(GeoServerService geoServerService)
        {
            _geoServerService = geoServerService;
        }

        [HttpGet("points")]
        public async Task<IActionResult> GetPoints(int userId)
        {
            var result = await _geoServerService
                .GetLayerAsync("tbl_point", userId);

            return Content(result, "application/json");
        }

        [HttpGet("lines")]
        public async Task<IActionResult> GetLines(int userId)
        {
            var result = await _geoServerService
                .GetLayerAsync("tbl_line", userId);

            return Content(result, "application/json");
        }

        [HttpGet("polygons")]
        public async Task<IActionResult> GetPolygons(int userId)
        {
            var result = await _geoServerService
                .GetLayerAsync("tbl_polygon", userId);

            return Content(result, "application/json");
        }
    }
}