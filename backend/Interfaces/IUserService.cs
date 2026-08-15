using backend_new.Models;

namespace backend_new.Interfaces
{
    public interface IUserService
    {
        Task<List<User>> GetAllAsync();
        Task AddAsync(User user);
    }
}
