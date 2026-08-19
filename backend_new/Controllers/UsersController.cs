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

        public UsersController(
            IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var users =
                    await _userService.GetAllAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Kullanıcılar yüklenirken hata oluştu.",
                        detail = ex.Message
                    }
                );
            }
        }

        [HttpPost]
        public async Task<IActionResult> Add(
            User user)
        {
            try
            {
                await _userService.AddAsync(user);

                return Ok(new
                {
                    message =
                        "Kullanıcı kaydedildi."
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
                            "Kullanıcı kaydedilirken hata oluştu.",
                        detail = ex.Message
                    }
                );
            }
        }
    }
}