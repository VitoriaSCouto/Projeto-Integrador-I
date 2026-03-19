export const handleMessage = async (msg, client) => {

    const text = msg.body.toLowerCase().trim();

    if (text === "oi" || text === "menu" || text === "olá" || text === "ola") {

        await msg.reply(
`🌧️ *Sistema de Apoio em Desastres Naturais*

Olá! Eu sou o assistente da Defesa Civil 🤝  
Estou aqui para ajudar em situações de emergência.

Escolha uma opção digitando o número:

1️⃣ Receber alertas de desastres  
2️⃣ Pedir ajuda  
3️⃣ Abrigos disponíveis  
4️⃣ Assistência psicológica  
5️⃣ Relatar problema  
6️⃣ Telefones de emergência  
7️⃣ Registrar pessoa desaparecida  
8️⃣ Informações de segurança  
9️⃣ Encerrar atendimento`
        );

        return;
    }

    switch(text){

        case "1":
            await msg.reply(
`⚠️ *Alertas de Desastres*

No momento não há alertas críticos na sua região.

Em caso de previsão de:
🌧️ Chuvas fortes  
🌊 Enchentes  
🌪️ Ventos intensos  
⛰️ Deslizamentos

A Defesa Civil enviará avisos imediatamente.

📢 Fique atento às orientações oficiais.`
            );
            break;

        case "2":
            await msg.reply(
`🚨 *Pedido de Ajuda*

Se você ou alguém próximo está em situação de risco, procure um local seguro imediatamente.

Descreva sua situação para que possamos registrar o pedido de ajuda.

Exemplo:
"Minha casa está alagando no bairro X"`

            );
            break;

        case "3":
            await msg.reply(
`🏠 *Abrigos disponíveis*

Em situações de emergência, os seguintes locais podem servir como abrigo:

📍 Escola Municipal Central  
📍 Ginásio Municipal de Esportes  
📍 Centro Comunitário do Bairro

Esses locais oferecem:
🛏️ Espaço seguro  
💧 Água potável  
🍞 Alimentação básica`
            );
            break;

        case "4":
            await msg.reply(
`💙 *Assistência Psicológica*

Situações de desastre podem causar medo e ansiedade.

Se você precisar conversar ou receber apoio emocional, procure:

👩‍⚕️ Posto de Saúde mais próximo  
☎️ Centro de Atenção Psicossocial (CAPS)

Você não está sozinho.`
            );
            break;

        case "5":
            await msg.reply(
`📢 *Relatar Problema*

Você pode relatar situações como:

🌳 Queda de árvores  
⚡ Falta de energia  
🌊 Alagamentos  
⛰️ Risco de deslizamento

Descreva o problema e informe o bairro ou local aproximado.`
            );
            break;

        case "6":
            await msg.reply(
`📞 *Telefones de Emergência*

🚒 Bombeiros: 193  
🚑 SAMU: 192  
👮 Polícia: 190  
🛟 Defesa Civil: 199

Em caso de emergência, ligue imediatamente para um desses números.`
            );
            break;

        case "7":
            await msg.reply(
`🔎 *Registro de Pessoa Desaparecida*

Se alguém desapareceu durante uma situação de desastre, envie:

👤 Nome da pessoa  
📍 Último local onde foi vista  
📅 Data e horário aproximado

Essas informações ajudam nas buscas.`
            );
            break;

        case "8":
            await msg.reply(
`🛟 *Dicas de Segurança*

Durante chuvas fortes ou enchentes:

⚠️ Evite áreas alagadas  
⚠️ Não atravesse correntezas  
⚠️ Desligue a energia se houver risco de água entrar na casa  
⚠️ Procure locais elevados e seguros

A prevenção salva vidas.`
            );
            break;

        case "9":
            await msg.reply(
`👋 *Atendimento encerrado*

Se precisar de ajuda novamente, basta enviar:

👉 *oi*

Estou sempre aqui para ajudar!`
            );
            break;

        default:
            await msg.reply(
`❓ Não entendi sua mensagem.

Digite *oi* para abrir o menu novamente.`
            );
    }

};