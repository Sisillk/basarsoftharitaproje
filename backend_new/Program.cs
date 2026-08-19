using backend_new.Data;
using backend_new.Interfaces;
using backend_new.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();


// -------------------------
// USER
// -------------------------

builder.Services.AddScoped<
    IUserRepository,
    UserRepository
>();

builder.Services.AddScoped<
    IUserService,
    UserService
>();


// -------------------------
// GEOMETRY
// -------------------------

builder.Services.AddScoped<
    IGeometryRepository,
    GeometryRepository
>();

builder.Services.AddScoped<
    IGeometryService,
    GeometryService
>();


// -------------------------
// ADMIN
// -------------------------

builder.Services.AddScoped<
    IAdminRepository,
    AdminRepository
>();

builder.Services.AddScoped<
    IAdminService,
    AdminService
>();


// -------------------------
// TOKEN
// -------------------------

builder.Services.AddScoped<TokenService>();


// -------------------------
// CORS
// -------------------------

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "ReactPolicy",
        policy =>
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    );
});


// -------------------------
// JWT
// -------------------------

builder.Services
    .AddAuthentication(
        JwtBearerDefaults
            .AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    builder.Configuration[
                        "Jwt:Issuer"
                    ],

                ValidAudience =
                    builder.Configuration[
                        "Jwt:Audience"
                    ],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            builder.Configuration[
                                "Jwt:Key"
                            ]!
                        )
                    ),

                ClockSkew =
                    TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient<GeoServerService>();


var app = builder.Build();

app.UseCors("ReactPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run("http://localhost:5092");