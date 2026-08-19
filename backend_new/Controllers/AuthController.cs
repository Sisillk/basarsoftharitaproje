using backend_new.Interfaces;
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
        private readonly IAdminService _adminService;
        private readonly IPasswordService _passwordService;

        public AuthController(
            TokenService tokenService,
            IAdminService adminService,
            IPasswordService passwordService)
        {
            _tokenService = tokenService;
            _adminService = adminService;
            _passwordService = passwordService;
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login(
            LoginRequest request)
        {
            try
            {
                if (
                    string.IsNullOrWhiteSpace(request.Username) ||
                    string.IsNullOrWhiteSpace(request.Password)
                )
                {
                    return BadRequest(new
                    {
                        message =
                            "Kullanıcı adı ve şifre boş olamaz."
                    });
                }


                var user =
                    await _adminService
                        .GetAuthUserByUsernameAsync(
                            request.Username
                        );


                if (
                    user == null ||
                    user.IsDeleted ||
                    !user.IsActive ||
                    string.IsNullOrWhiteSpace(
                        user.PasswordHash
                    )
                )
                {
                    return Unauthorized(new
                    {
                        message =
                            "Kullanıcı adı veya şifre yanlış."
                    });
                }


                bool passwordCorrect =
                    _passwordService
                        .VerifyPassword(
                            user.PasswordHash,
                            request.Password
                        );


                if (!passwordCorrect)
                {
                    return Unauthorized(new
                    {
                        message =
                            "Kullanıcı adı veya şifre yanlış."
                    });
                }


                var token =
                    _tokenService.CreateToken(
                        user.Username,
                        user.Id
                    );


                return Ok(new
                {
                    token,
                    expiresIn = 600,
                    userId = user.Id
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

                        detail =
                            ex.Message
                    }
                );
            }
        }
    }
}