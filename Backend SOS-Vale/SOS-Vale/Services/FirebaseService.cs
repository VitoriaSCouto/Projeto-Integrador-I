using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;

namespace SosVale.Services
{
    public class FirebaseService
    {
        public FirebaseService()
        {
            // Usamos para inicializar o Firebase só uma vez
            if (FirebaseApp.DefaultInstance == null)
            {
                // Inicializa o Firebase usando as credenciais do arquivo JSON
                FirebaseApp.Create(new AppOptions()
                {
                    Credential = GoogleCredential.FromFile("serviceAccountKey.json")
                });
            }
        }

        // Método para validar o token JWT recebido do frontend
        public async Task<string?> ValidarToken(string token)
        {
            //  Tenta verificar o token usando o FirebaseAuth
            try
            {
                // Se o token for válido, o Firebase retorna um objeto FirebaseToken com as informações do usuário
                FirebaseToken decoded = await FirebaseAuth.DefaultInstance
                    .VerifyIdTokenAsync(token);
                return decoded.Uid; 
            }
            catch
            {
                // Se o token for inválido ou expirado, o Firebase lança uma exceção, e retornamos null para indicar que a validação falhou
                return null; 
            }
        }
    }
}