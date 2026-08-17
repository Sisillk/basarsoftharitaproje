using backend_new.Models;
using backend_new.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend_new.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly TokenService _tokenService;

        public AuthController(
            TokenService tokenService)
        {
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public IActionResult Login(
            LoginRequest request)
        {
            try
            {
                if (
                    request.Username == "sisilkadioglu" &&
                    request.Password == "2005"
                )
                {
                    // Demo kullanıcımızın ID'si
                    int userId = 1;

                    var token =
                        _tokenService.CreateToken(
                            request.Username,
                            userId
                        );

                    return Ok(new
                    {
                        token,
                        expiresIn = 600,
                        userId
                    });
                }

                return Unauthorized(new
                {
                    message =
                        "Kullanıcı adı veya şifre yanlış."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Giriş işlemi sırasında bir hata oluştu.",
                        detail = ex.Message
                    }
                );
            }
        }
    }
}