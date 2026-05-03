
// ARMAZENAMENTO DE REGISTROS (futuro banko de dados)

const registros = [];

function salvarRegistro(tipo, dados) {
    const novoRegistro = {
        id: `${tipo.toUpperCase().substring(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        tipo: tipo,
        numero_usuario: dados.numero_usuario,
        dados: dados,
        status: 'pendente', // pendente, em_atendimento, atendido, cancelado
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
    };
    
    registros.push(novoRegistro);
    console.log(`Registro salvo: ${novoRegistro.id} - ${tipo}`);
    
    return novoRegistro;
}


const userState = new Map();

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
export const handleMessage = async (msg, client) => {
    const from = msg.from;
    const text = msg.body.toLowerCase().trim();
    
    let state = userState.get(from);
    
    // ============================================
    // FLUXO: ASSISTÊNCIA PSICOLÓGICA (opção 4)
    // ============================================
    
    if (state && state.step === 'psycho_need') {
        const opcoes = {
            '1': 'conversar',
            '2': 'ansiedade',
            '3': 'familia',
            '4': 'crise',
            '5': 'desabafar',
            '6': 'outro'
        };
        
        state.tempData.motivo = opcoes[text] || text;
        state.step = 'psycho_description';
        await msg.reply(
`Se quiser, descreva como está se sentindo ou o que está passando.

Isso ajuda o psicólogo voluntário a te entender melhor antes do contato.

Exemplo: "Perdi minha casa na enchente e estou me sentindo perdido"
ou "Não consigo dormir desde que aconteceu"

Você pode digitar apenas "NAO" se não quiser descrever agora.`
        );
        return;
    }
    
    if (state && state.step === 'psycho_description') {
        state.tempData.descricao = text === 'nao' ? 'não informado' : msg.body;
        state.step = 'psycho_contact';
        await msg.reply(
`Como você prefere ser contatado?

1 - Telefone (ligação)
2 - WhatsApp (mensagem)
3 - Não quero contato agora, só registrar meu relato

Digite o número da opção.`
        );
        return;
    }
    
    if (state && state.step === 'psycho_contact') {
        if (text === '1') {
            state.tempData.contato_preferencia = 'telefone';
            state.step = 'psycho_phone';
            await msg.reply(
`Informe seu telefone com DDD para contato:

Exemplo: 11999999999`
            );
            return;
        } else if (text === '2') {
            state.tempData.contato_preferencia = 'whatsapp';
            state.step = 'psycho_phone';
            await msg.reply(
`Informe seu telefone com DDD (o mesmo do WhatsApp):

Exemplo: 11999999999`
            );
            return;
        } else if (text === '3') {
            state.tempData.contato_preferencia = 'nenhum';
            state.tempData.telefone = 'não informado';
            
            const registro = salvarRegistro('apoio_psicologico', {
                numero_usuario: from,
                ...state.tempData
            });
            
            await msg.reply(
`✅ RELATO REGISTRADO COM SUCESSO

Protocolo: ${registro.id}

Seu relato foi salvo e será encaminhado para a equipe de apoio psicológico.

🧠 Lembre-se: Você não está sozinho. Buscar ajuda é um ato de coragem.

Se mudar de ideia sobre o contato, basta voltar ao menu e escolher a opção 4 novamente.

Digite *oi* para voltar ao menu principal.`
            );
            userState.delete(from);
            return;
        } else {
            await msg.reply(
`Opção inválida. Digite 1, 2 ou 3.`
            );
            return;
        }
    }
    
    if (state && state.step === 'psycho_phone') {
        state.tempData.telefone = msg.body;
        
        const registro = salvarRegistro('apoio_psicologico', {
            numero_usuario: from,
            ...state.tempData,
            status_contato: 'aguardando_contato'
        });
        
        await msg.reply(
`✅ PEDIDO DE APOIO PSICOLÓGICO REGISTRADO

📋 Protocolo: ${registro.id}
📞 Preferência: ${state.tempData.contato_preferencia}
📱 Telefone: ${state.tempData.telefone}

🧠 Em breve um psicólogo voluntário entrará em contato com você.

Se estiver passando por uma crise emocional grave agora, ligue imediatamente para:
📞 CVV - 188 (24h, gratuito)

Você não está sozinho.

Digite *oi* para voltar ao menu principal.`
        );
        userState.delete(from);
        return;
    }
    
    // ============================================
    // FLUXO: PEDIDO DE AJUDA (opção 2)
    // ============================================
    
    if (state && state.step === 'help_address') {
        state.tempData.endereco = msg.body;
        state.step = 'help_people';
        await msg.reply(
`Quantas pessoas estão no local (incluindo você)?

Digite apenas o número.`
        );
        return;
    }
    
    if (state && state.step === 'help_people') {
        const pessoas = parseInt(msg.body);
        state.tempData.pessoas = isNaN(pessoas) ? 1 : pessoas;
        state.step = 'help_occurrence';
        await msg.reply(
`O que está acontecendo?

Digite o número:

1 - Alagamento / Enchente
2 - Deslizamento de terra
3 - Incêndio
4 - Desabamento
5 - Encalhado em local isolado
6 - Outro problema`
        );
        return;
    }
    
    if (state && state.step === 'help_occurrence') {
        const tipos = {
            '1': 'alagamento/enchente',
            '2': 'deslizamento de terra',
            '3': 'incêndio',
            '4': 'desabamento',
            '5': 'pessoa encalhada/isolada',
            '6': 'outro'
        };
        state.tempData.ocorrencia = tipos[text] || text;
        state.step = 'help_severity';
        await msg.reply(
`Qual a gravidade?

1 - Leve (sem risco imediato)
2 - Moderada (precisa de atenção)
3 - Grave (risco à vida)
4 - Crítica (emergência agora)`
        );
        return;
    }
    
    if (state && state.step === 'help_severity') {
        const gravidades = {
            '1': 'leve',
            '2': 'moderada',
            '3': 'grave',
            '4': 'critica'
        };
        state.tempData.gravidade = gravidades[text] || 'moderada';
        state.step = 'help_contact';
        await msg.reply(
`Informe um telefone para contato (com DDD):

Ex: 11999999999

Digite NAO se não quiser informar.`
        );
        return;
    }
    
    if (state && state.step === 'help_contact') {
        state.tempData.telefone_contato = text === 'nao' ? 'não informado' : msg.body;
        
        const registro = salvarRegistro('pedido_ajuda', {
            numero_usuario: from,
            ...state.tempData
        });
        
        await msg.reply(
`✅ PEDIDO DE AJUDA REGISTRADO

Protocolo: ${registro.id}
Endereço: ${state.tempData.endereco}
Pessoas: ${state.tempData.pessoas}
Ocorrência: ${state.tempData.ocorrencia}
Gravidade: ${state.tempData.gravidade}

Sua solicitação foi encaminhada.

Se for URGENTE, ligue: 193 ou 199

Digite *oi* para voltar ao menu.`
        );
        userState.delete(from);
        return;
    }
    
    // ============================================
    // FLUXO: RELATAR PROBLEMA (opção 5)
    // ============================================
    
    if (state && state.step === 'problem_type') {
        const tipos = {
            '1': 'arvore_caida',
            '2': 'alagamento_enchente',
            '3': 'falta_energia',
            '4': 'risco_deslizamento',
            '5': 'bueiro_entupido',
            '6': 'via_interditada',
            '7': 'outro'
        };
        state.tempData.tipo_problema = tipos[text] || text;
        state.step = 'problem_address';
        await msg.reply(
`Informe o endereço completo:

Ex: Rua das Flores, 123 - Bairro Centro`
        );
        return;
    }
    
    if (state && state.step === 'problem_address') {
        state.tempData.endereco = msg.body;
        state.step = 'problem_description';
        await msg.reply(
`Descreva o problema com detalhes:

Ex: "Árvore bloqueando toda a via"`
        );
        return;
    }
    
    if (state && state.step === 'problem_description') {
        state.tempData.descricao = msg.body;
        
        const registro = salvarRegistro('relato_problema', {
            numero_usuario: from,
            ...state.tempData
        });
        
        await msg.reply(
`✅ PROBLEMA REGISTRADO

Protocolo: ${registro.id}
Tipo: ${state.tempData.tipo_problema}
Endereço: ${state.tempData.endereco}

Sua notificação foi enviada à Defesa Civil.

Digite *oi* para voltar ao menu.`
        );
        userState.delete(from);
        return;
    }
    
    // ============================================
    // FLUXO: PESSOA DESAPARECIDA (opção 7)
    // ============================================
    
    if (state && state.step === 'missing_name') {
        state.tempData.nome = msg.body;
        state.step = 'missing_location';
        await msg.reply(
`Último local onde foi vista:

Ex: Praça Central, próximo à igreja`
        );
        return;
    }
    
    if (state && state.step === 'missing_location') {
        state.tempData.ultimo_local = msg.body;
        state.step = 'missing_date';
        await msg.reply(
`Data e horário aproximado:

Ex: 15/01/2024, por volta das 14h`
        );
        return;
    }
    
    if (state && state.step === 'missing_date') {
        state.tempData.data_hora = msg.body;
        state.step = 'missing_description';
        await msg.reply(
`Idade, altura, cor de roupa e outras características:

Ex: 45 anos, 1,75m, camisa azul, calça jeans`
        );
        return;
    }
    
    if (state && state.step === 'missing_description') {
        state.tempData.descricao_fisica = msg.body;
        state.step = 'missing_contact';
        await msg.reply(
`Telefone para contato (com DDD):

Ex: 11999999999
Digite NAO se não quiser informar.`
        );
        return;
    }
    
    if (state && state.step === 'missing_contact') {
        state.tempData.telefone_contato = text === 'nao' ? 'não informado' : msg.body;
        
        const registro = salvarRegistro('pessoa_desaparecida', {
            numero_usuario: from,
            ...state.tempData
        });
        
        await msg.reply(
`✅ REGISTRO DE DESAPARECIDO CONCLUÍDO

Protocolo: ${registro.id}
Nome: ${state.tempData.nome}
Local: ${state.tempData.ultimo_local}

As equipes de busca foram acionadas.

Digite *oi* para voltar ao menu.`
        );
        userState.delete(from);
        return;
    }
    
    // ============================================
    // FLUXO: RECEBER ALERTAS (opção 1)
    // ============================================
    
    if (state && state.step === 'alert_subscribe') {
        if (text === 'sim' || text === 'quero' || text === 'confirmo') {
            const registro = salvarRegistro('cadastro_alerta', {
                numero_usuario: from,
                status: 'ativo',
                data_cadastro: new Date().toISOString()
            });
            
            await msg.reply(
`✅ Você está cadastrado para receber alertas de desastres.

Você receberá notificações sobre:
- Chuvas fortes
- Enchentes
- Ventos intensos
- Deslizamentos

Digite *oi* para voltar ao menu.`
            );
        } else {
            await msg.reply(
`❌ Cadastro cancelado.

Você não receberá alertas automáticos.

Digite *oi* para voltar ao menu.`
            );
        }
        userState.delete(from);
        return;
    }
    
    // ============================================
    // FLUXO: CONFIRMAR SEGURANÇA (opção 9)
    // ============================================
    
    if (state && state.step === 'safety_name') {
        state.tempData.nome = msg.body;
        state.step = 'safety_address';
        await msg.reply(
`Informe seu endereço completo.`
        );
        return;
    }
    
    if (state && state.step === 'safety_address') {
        state.tempData.endereco = msg.body;
        state.step = 'safety_message';
        await msg.reply(
`Opcional: alguma informação adicional? (Digite NAO para pular)`
        );
        return;
    }
    
    if (state && state.step === 'safety_message') {
        state.tempData.mensagem = text === 'nao' ? '' : msg.body;
        
        const registro = salvarRegistro('confirmacao_seguranca', {
            numero_usuario: from,
            ...state.tempData,
            status: 'seguro'
        });
        
        await msg.reply(
`✅ Segurança confirmada!

Protocolo: ${registro.id}

Seu registro foi enviado à Defesa Civil.

Digite *oi* para voltar ao menu.`
        );
        userState.delete(from);
        return;
    }
    
    // ============================================
    // MENU PRINCIPAL
    // ============================================
    
    if (text === "oi" || text === "menu" || text === "olá" || text === "ola") {
        if (state) userState.delete(from);
        
        await msg.reply(
`🌧️ SISTEMA DE APOIO EM DESASTRES NATURAIS

Olá! Sou o assistente da Defesa Civil.

Escolha uma opção digitando o número:

1️⃣ Receber alertas de desastres
2️⃣ Pedir ajuda
3️⃣ Abrigos disponíveis
4️⃣ Apoio psicológico (com psicólogos voluntários)
5️⃣ Relatar problema
6️⃣ Telefones de emergência
7️⃣ Registrar pessoa desaparecida
8️⃣ Informações de segurança
9️⃣ Confirmar que estou seguro
🔟 Encerrar atendimento`
        );
        return;
    }
    
    // ============================================
    // TRATAMENTO DAS OPÇÕES
    // ============================================
    
    switch(text) {
        
        case "1":
            await msg.reply(
`⚠️ ALERTAS DE DESASTRES

Deseja receber notificações de risco na sua região?

Digite SIM para começar a receber os alertas ou NAO para cancelar.`
            );
            userState.set(from, { step: 'alert_subscribe', tempData: {} });
            break;
            
        case "2":
            await msg.reply(
`🚨 PEDIDO DE AJUDA

Vamos registrar sua solicitação.

Informe seu ENDEREÇO completo:
Ex: Rua das Flores, 123 - Bairro Centro`
            );
            userState.set(from, { step: 'help_address', tempData: {} });
            break;
            
        case "3":
            await msg.reply(
`🏠 ABRIGOS DISPONÍVEIS

📍 Escola Municipal Central
   Rua A, 100 - Capacidade: 200 pessoas

📍 Ginásio Municipal de Esportes
   Av. B, 500 - Capacidade: 300 pessoas (aceita pets)

📍 Centro Comunitário do Bairro
   Rua C, 45 - Capacidade: 150 pessoas

Todos os abrigos oferecem água, alimentação e colchões.

Para atualizações, digite *oi* e escolha a opção 3 novamente.`
            );
            break;
            
        case "4":
            await msg.reply(
`💙 APOIO PSICOLÓGICO

Você não está sozinho. Psicólogos voluntários estão disponíveis para te ajudar.

Como podemos te ajudar?

1 - Quero conversar com alguém
2 - Estou me sentindo ansioso(a)
3 - Alguém da minha família precisa de apoio
4 - Estou em crise emocional agora
5 - Só quero desabafar
6 - Outro motivo

Digite o número da opção.`
            );
            userState.set(from, { step: 'psycho_need', tempData: {} });
            break;
            
        case "5":
            await msg.reply(
`📢 RELATAR PROBLEMA

Qual o tipo do problema?

1 - Árvore caída
2 - Alagamento/enchente
3 - Falta de energia
4 - Risco de deslizamento
5 - Bueiro entupido
6 - Via interditada
7 - Outro

Digite o número da opção.`
            );
            userState.set(from, { step: 'problem_type', tempData: {} });
            break;
            
        case "6":
            await msg.reply(
`📞 TELEFONES DE EMERGÊNCIA

🚒 Bombeiros: 193
🚑 SAMU: 192
👮 Polícia: 190
🛟 Defesa Civil: 199
🧠 Apoio psicológico (CVV): 188

Salve esses números no seu celular.`
            );
            break;
            
        case "7":
            await msg.reply(
`🔎 REGISTRAR PESSOA DESAPARECIDA

Vamos registrar os dados da pessoa desaparecida.

Informe o NOME COMPLETO:`
            );
            userState.set(from, { step: 'missing_name', tempData: {} });
            break;
            
        case "8":
            await msg.reply(
`🛟 INFORMAÇÕES DE SEGURANÇA

DURANTE CHUVAS FORTES:
- Evite áreas alagadas
- Não atravesse correntezas
- Desligue a energia se água entrar em casa
- Procure locais elevados

ANTES DO DESASTRE:
- Monte uma mochila de emergência
- Mantenha documentos em local seguro
- Tenha lanterna e pilhas extras

A prevenção salva vidas.`
            );
            break;
            
        case "9":
            await msg.reply(
`✅ CONFIRMAR QUE ESTOU SEGURO

Use esta opção para avisar que você está seguro.

Isso ajuda a Defesa Civil a priorizar quem precisa de resgate.

Informe seu NOME:`
            );
            userState.set(from, { step: 'safety_name', tempData: {} });
            break;
            
        case "10":
            await msg.reply(
`👋 ATENDIMENTO ENCERRADO

Você não receberá mais mensagens até digitar *oi* novamente.

Em caso de emergência, ligue para 193 ou 199.

Para reativar o atendimento, digite *oi*.`
            );
            userState.delete(from);
            break;
            
        default:
            await msg.reply(
`❌ Não entendi "${msg.body}"

Digite:
- *oi* para abrir o menu
- O número da opção desejada (1 a 10)
- Ou siga as instruções do fluxo que você estava`
            );
    }
};