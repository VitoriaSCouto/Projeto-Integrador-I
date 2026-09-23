// Cliente da API do S.O.S Vale usado pelo bot
//
// Envia o cabeçalho x-bot-key (BOT_API_KEY do .env), exigido pelas rotas
// /api/bot/*. Nas rotas públicas o cabeçalho é simplesmente ignorado.

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Retorna { ok, status, dados }. Lança erro só se a API estiver fora do ar.
export async function api(metodo, caminho, corpo) {
    const resposta = await fetch(`${API_URL}/api${caminho}`, {
        method: metodo,
        headers: {
            ...(corpo ? { 'Content-Type': 'application/json' } : {}),
            'x-bot-key': process.env.BOT_API_KEY ?? ''
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
        signal: AbortSignal.timeout(30000)
    });

    let dados = {};
    try {
        dados = await resposta.json();
    } catch {
        // resposta sem corpo JSON
    }

    return { ok: resposta.ok, status: resposta.status, dados };
}
