namespace backend_new.Interfaces
{
    public interface IPasswordService
    {
        string HashPassword(string password);

        bool VerifyPassword(
            string passwordHash,
            string password
        );
    }
}
