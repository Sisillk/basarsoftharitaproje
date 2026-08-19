
using backend_new.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace backend_new.Services
{
    public class PasswordService : IPasswordService
    {
        private readonly PasswordHasher<string> _passwordHasher;

        public PasswordService()
        {
            _passwordHasher = new PasswordHasher<string>();
        }

        public string HashPassword(string password)
        {
            return _passwordHasher.HashPassword(
                string.Empty,
                password
            );
        }

        public bool VerifyPassword(
            string passwordHash,
            string password
        )
        {
            var result =
                _passwordHasher.VerifyHashedPassword(
                    string.Empty,
                    passwordHash,
                    password
                );

            return result != PasswordVerificationResult.Failed;
        }
    }
}