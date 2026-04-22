using SosVale.Services;

//Cria o builder para configurar a aplicação
var builder = WebApplication.CreateBuilder(args);


//Adiciona os serviços necessários para a aplicação, incluindo controladores e o serviço Firebase para validação de tokens
builder.Services.AddControllers();
builder.Services.AddSingleton<FirebaseService>();

//Configura a política de CORS para permitir solicitações de qualquer origem, método e cabeçalho, facilitando a comunicação entre o frontend e o backend
builder.Services.AddCors(options =>
{
    // Define a política de CORS chamada "Permitir" que permite solicitações de qualquer origem, método e cabeçalho
    options.AddPolicy("Permitir", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

//Constrói a aplicação com as configurações definidas e inicia o servidor para ouvir as solicitações
var app = builder.Build();

app.UseCors("Permitir");// Aplica a política de CORS "Permitir" a todas as solicitações, garantindo que o backend possa receber requisições do frontend sem restrições de origem
app.UseAuthorization();// Habilita o middleware de autorização, que pode ser usado para proteger endpoints específicos, embora neste caso não haja autenticação adicional além da validação do token Firebase
app.MapControllers();// Mapeia os controladores para as rotas correspondentes, permitindo que as requisições sejam direcionadas para os métodos corretos nos controladores definidos na aplicação
app.Run();// Inicia o servidor e começa a ouvir as solicitações