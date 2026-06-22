export const registros = [];

export function salvarRegistro(tipo, dados) {
    const novoRegistro = {
        id: `${tipo.toUpperCase().substring(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        tipo: tipo,
        numero_usuario: dados.numero_usuario,
        dados: dados,
        status: 'pendente',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
    };

    registros.push(novoRegistro);

    console.log(`Registro salvo: ${novoRegistro.id} - ${tipo}`);

    return novoRegistro;
}