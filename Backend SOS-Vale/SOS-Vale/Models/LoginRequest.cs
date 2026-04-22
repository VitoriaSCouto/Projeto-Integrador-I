namespace SosVale.Models
{
    public class LoginRequest
    {
        // Armazena o token JWT enviado pelo frontend
        public string Token { get; set; } = string.Empty;
    }
}