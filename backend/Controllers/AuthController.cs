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

        public AuthController(TokenService tokenService)
        {
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public IActionResult Login(LoginRequest request)
        {
            if (
                request.Username == "sisilkadioglu" &&
                request.Password == "2005"
            )
            {
                var token = _tokenService.CreateToken(request.Username);

                return Ok(new
                {
                    token,
                    expiresIn = 600
                });
            }

            return Unauthorized(new
            {
                message = "Kullanıcı adı veya şifre yanlış."
            });
        }
    }
}
