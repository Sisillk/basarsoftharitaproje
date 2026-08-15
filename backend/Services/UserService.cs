using backend_new.Interfaces;
using backend_new.Models;

namespace backend_new.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _userRepository.GetAllAsync();
        }

        public async Task AddAsync(User user)
        {
            if (string.IsNullOrWhiteSpace(user.Name))
            {
                throw new ArgumentException(
                    "Kullanıcı adı boş olamaz."
                );
            }

            if (
                string.IsNullOrWhiteSpace(user.Email) ||
                !user.Email.Contains("@")
            )
            {
                throw new ArgumentException(
                    "Geçerli bir e-posta girilmelidir."
                );
            }

            await _userRepository.AddAsync(user);
        }
    }
}