using backend_new.Interfaces;
using backend_new.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend_new.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _userService.GetAllAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Add(User user)
        {
            await _userService.AddAsync(user);

            return Ok(new
            {
                message = "Kullanıcı kaydedildi."
            });
        }
    }
}
