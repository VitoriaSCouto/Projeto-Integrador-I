import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { handleMessage } from "./controllers/message-controller.js";

const { Client, LocalAuth } = pkg;

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on("qr", (qr) => {
    console.log("Escaneie o QR Code:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("Bot conectado!");
});

client.on("message", async (msg) => {
    await handleMessage(msg, client);
});

client.initialize();