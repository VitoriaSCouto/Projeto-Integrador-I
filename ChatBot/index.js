import "dotenv/config";
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { handleMessage } from "./controllers/message-controller.js";
import { iniciarEnvioDeNotificacoes } from "./services/notificacao-service.js";
import { corrigirTelefonesDosInscritos } from "./services/telefone.js";

const { Client, LocalAuth } = pkg;

if (!process.env.BOT_API_KEY) {
    console.warn("⚠️  BOT_API_KEY não definida no .env — o sistema de alertas não vai funcionar.");
}

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on("qr", (qr) => {
    console.log("Escaneie o QR Code:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("Bot conectado!");
    // Começa a enviar os alertas que estão na fila da API
    iniciarEnvioDeNotificacoes(client);
    // Corrige inscritos que ficaram com o código interno do WhatsApp no lugar do telefone
    corrigirTelefonesDosInscritos(client);
});

client.on("message", async (msg) => {
    try {
        await handleMessage(msg, client);
    } catch (erro) {
        // Um erro numa conversa não pode derrubar o bot
        console.error("[BOT] Erro ao processar mensagem:", erro);
    }
});

client.initialize();
