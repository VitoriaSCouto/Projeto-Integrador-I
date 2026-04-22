using Microsoft.AspNetCore.Mvc;
using SosVale.Models;
using SosVale.Services;

namespace SosVale.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // Injeção do serviço Firebase para validação de tokens
        private readonly FirebaseService _firebase;

        // Construtor para injeção de dependência
        public AuthController(FirebaseService firebase)
        {
            // Atribui o serviço Firebase ao campo privado para uso nos métodos do controlador
            _firebase = firebase;
        }
        
        // Endpoint para validar o token enviado pelo frontend
        [HttpPost("validar")]
        public async Task<IActionResult> Validar([FromBody] LoginRequest request)
        {
            // Valida o token usando o serviço Firebase
            var uid = await _firebase.ValidarToken(request.Token);

            //Se o ID do usuario for nulo, o token é inválido ou expirado
            if (uid == null)
                return Unauthorized(new { mensagem = "Token inválido ou expirado." });

            // Se o token for válido, retorna uma resposta de sucesso com o ID do usuário
            return Ok(new { mensagem = "Autenticado com sucesso!", userId = uid });
        }
    }
}
