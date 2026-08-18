namespace backend_new.Models
{
    public class UserAuthorizationRequest
    {
        public List<int> RoleIds { get; set; } = new();

        public List<int> DirectPermissionIds { get; set; } = new();
    }
}