# Guia: testar o sistema de alertas e vincular o grupo do WhatsApp

Este guia tem duas partes:

- **Parte 1 – Modo teste:** testa tudo no computador, com banco de mentira e WhatsApp simulado. Não mexe no Supabase nem manda mensagem de verdade.
- **Parte 2 – Para valer:** liga o bot no WhatsApp real e vincula o grupo de alertas da cidade.

Todos os comandos são digitados no terminal do VS Code (PowerShell), a partir da pasta do projeto.

---

## Parte 1 – Modo teste

### O que você precisa
- As dependências instaladas: `npm install` dentro de `Backend`, `Frontend` e `ChatBot`.
- Internet, para a consulta de CEP (ViaCEP).
- **A API normal fechada.** Se algum terminal estiver com `npm run dev` ou `npm run back` rodando, aperte `Ctrl + C` nele.

### Passo 1 – Abrir o banco de teste (terminal 1)
```
cd Backend
npm run banco:teste
```
Espere aparecer `Banco de teste pronto...` e **deixe este terminal aberto**.
Quando você fechar esse terminal, tudo o que foi criado some.

O banco já abre com **dados de exemplo**:
- admin do painel: `adm@teste.com` / `123456`;
- cidades Caçapava, Pindamonhangaba e Taubaté (SP), com bairros;
- abrigo Escola Municipal Centro (Taubaté);
- moradores inscritos Ana (`5512900000001`) e Bruno (`5512900000002`), do Centro de Taubaté;
- um **alerta de alagamento no Centro de Taubaté com 2 de 3 relatos**. O próximo relato igual dispara o alerta.

### Passo 2 – Abrir a API em modo teste (terminal 2)
```
cd Backend
npm run back:teste
```
Espere aparecer `Servidor rodando em http://localhost:3000` e **deixe aberto**.

> Se aparecer "Já existe uma API rodando na porta 3000", a API normal ainda está aberta. Feche-a e tente de novo.

### Passo 3 – Conversar com o bot usando mensagens falsas (terminal 3)
```
cd ChatBot
npm run teste:interativo
```
Digite como se estivesse no WhatsApp. As respostas do bot aparecem com 🤖.

Comandos especiais:

| Comando | O que faz |
|---|---|
| `/foto` | envia uma foto falsa (use quando o bot pedir a foto; a foto é opcional, digite `pular` para seguir sem ela) |
| `/numero 5512999990002` | vira outro morador (cada número é uma pessoa) |
| `/grupo <mensagem>` | envia a mensagem num grupo, como administrador do grupo |
| `/fila` | mostra as mensagens de alerta que seriam enviadas e para quem |
| `/sair` | encerra |

#### Roteiro sugerido: ver um alerta ser disparado

1. **Inscrever-se** (as cidades aparecem em ordem alfabética; Taubaté é a **3**)
   ```
   oi
   1          ← Alertas do meu bairro
   1          ← Quero me inscrever
   Joana
   joana@teste.com
   3          ← Taubaté
   centro     ← pode digitar o nome ou o número do bairro
   ```
2. **Relatar o alagamento**
   ```
   1          ← Relatar uma ocorrência
   1          ← Centro (onde você mora)
   1          ← Alagamento
   1          ← Grave
   /foto
   1          ← Enviar relato
   ```
   Ana e Bruno já tinham relatado, então o seu é o 3º. O bot responde **"ocorrência confirmada por 3 moradores"**.
3. **Ver para quem o alerta iria:** digite `/fila`. Aparecem Ana, Bruno e você.
4. **Ver a verificação funcionando:** use `/numero 5512999990002`, inscreva esse morador e relate outra ocorrência (por exemplo, Árvore caída). O bot responde **"Relatos até agora: 1/3"**: sozinho, o relato não dispara o alerta.
5. **Testar o comando de grupo:** digite `/grupo !alertas vincular Taubaté`. Depois de um novo disparo, o `/fila` mostra também o GRUPO.
6. **Testar o CEP:** num novo morador, escolha o bairro `0` ("Não encontrei o bairro") e digite um CEP, por exemplo `12070-610`.

### Passo 4 – Ver tudo no painel (opcional, terminal 4)
```
cd Frontend
npm run front
```
Abra `http://localhost:5173/login-adm` e entre com `adm@teste.com` / `123456`.
Em **Alertas**, **Inscritos** e **Regiões** aparece o que você criou no bot. Dá para testar confirmar, cancelar e encerrar alertas.

### Terminar o teste
Aperte `Ctrl + C` nos terminais 1, 2 (e 4). Os dados de teste somem. Na próxima vez que você abrir o banco, os dados de exemplo são recriados.

### Teste automático (opcional)
O `teste:api` roda 58 verificações automáticas. Ele cria os próprios dados, então precisa do **banco vazio**:
```
# terminal 1
cd Backend
npm run banco:teste:vazio
# terminal 2
cd Backend
npm run back:teste
# terminal 3
cd Backend
npm run teste:api
```
No fim deve aparecer **TODOS OS TESTES PASSARAM**. Para rodar de novo, feche e reabra o banco vazio.

### Problemas comuns

| Mensagem | O que fazer |
|---|---|
| `Já existe uma API rodando na porta 3000` | Feche a API normal (`Ctrl + C` no terminal dela) |
| `A API ... NÃO está em modo teste` | Você está com a API normal aberta. Use `npm run back:teste` |
| `EADDRINUSE ... 5433` ao abrir o banco | Já existe um banco de teste aberto. Feche-o ou use outra porta (abaixo) |
| `O banco de teste já tem dados` no `teste:api` | Abra o banco com `npm run banco:teste:vazio` |
| O bot não mostra cidades | O banco foi aberto com `banco:teste:vazio`. Use `npm run banco:teste` |

Para usar outras portas:
```
# terminal 1
$env:BANCO_TESTE_PORTA=5434; npm run banco:teste
# terminal 2
$env:BANCO_TESTE_PORTA=5434; $env:PORT=3100; npm run back:teste
# terminal 3
$env:API_URL="http://127.0.0.1:3100"; npm run teste:api
$env:API_URL="http://127.0.0.1:3100"; npm run teste:interativo
```
Com a API na porta 3100, o painel não funciona: as telas antigas usam a porta 3000.

---

## Parte 2 – Para valer: bot no WhatsApp e grupo da cidade

### O que você precisa
- **Um número de WhatsApp só para o bot.** Pode ser um chip barato, mas ele não pode ser o seu número pessoal.
- **Outro celular (o seu)** para ser administrador do grupo e mandar os comandos. O bot **ignora mensagens enviadas pelo próprio número dele**, então o comando precisa sair de outro número.
- **A mesma chave nos dois `.env`:** o `BOT_API_KEY` de `Backend/.env` precisa ser igual ao de `ChatBot/.env`. Isso já foi configurado.
- **A cidade cadastrada no painel**, em Regiões. Taubaté já existe.
- **O bucket `fotos-alerta` no Supabase:** Storage → New bucket → nome `fotos-alerta` → marcar como **Public**. Sem ele, os relatos ficam sem foto.

### Passo 1 – Ligar a API normal (terminal 1)
```
cd Backend
npm run back
```

### Passo 2 – Ligar o bot (terminal 2)
```
cd ChatBot
node index.js
```
- Na primeira vez aparece um **QR Code** no terminal. No celular **do bot**, abra WhatsApp → **Configurações** → **Aparelhos conectados** → **Conectar um aparelho**, e escaneie o QR Code.
- Espere aparecer:
  ```
  Bot conectado!
  [NOTIF] Envio de alertas ativo (verificando a fila a cada 15s)
  ```
- A sessão fica salva em `ChatBot/.wwebjs_auth`. Nas próximas vezes não precisa escanear de novo.

> Se aparecer `BOT_API_KEY não definida`, confira o `ChatBot/.env`.

### Passo 3 – Criar o grupo (no seu celular)
1. Crie o grupo, por exemplo **"Alertas Taubaté – S.O.S Vale"**.
2. **Adicione o número do bot** como participante.
3. Confira que **você** é administrador do grupo. Quem cria o grupo já é.

### Passo 4 – Vincular o grupo à cidade

**Jeito 1 – pelo próprio grupo (recomendado)**

Do **seu** celular, mande no grupo:
```
!alertas vincular Taubaté
```
O bot responde: **"✅ Pronto! Este grupo vai receber os alertas confirmados de Taubaté/SP."**

- Se existirem duas cidades com o mesmo nome, informe o estado: `!alertas vincular Taubaté/SP`.
- Se o bot responder "Apenas administradores do grupo podem usar este comando", quem mandou não é admin do grupo. Use o Jeito 2.
- Se o bot responder que a cidade não está cadastrada, cadastre-a antes no painel, em **Regiões**.

**Jeito 2 – pelo painel**
1. No grupo, mande `!alertas id`. O bot responde com o ID do grupo (algo como `120363012345678901@g.us`).
2. No painel, abra **Regiões**, clique na cidade, cole o ID no campo **"Grupo de alertas (ID do grupo)"** e clique em **Salvar**.

### Passo 5 – Conferir
- No painel, em **Regiões**, a cidade passa a mostrar o ícone verde do WhatsApp e a frase "Os alertas confirmados desta cidade também são publicados no grupo vinculado".
- Para testar o envio de verdade:
  - **Com moradores:** 3 pessoas (3 números diferentes) se inscrevem pelo bot no mesmo bairro e relatam a mesma ocorrência com foto.
  - **Sem esperar 3 relatos:** 1 pessoa relata; no painel, em **Alertas**, abra o alerta e clique em **Confirmar e disparar agora**.
- Em até ~15 segundos a mensagem chega no grupo e para os inscritos do bairro. Na tela do alerta, o quadro "Notificações pelo WhatsApp" mostra quantas foram enviadas.
- Se foi só um teste, clique em **Cancelar alerta (enviar correção)**. Todo mundo que recebeu o aviso recebe uma mensagem dizendo que ele foi cancelado.

### Outros comandos do grupo
| Comando | Quem pode | O que faz |
|---|---|---|
| `!alertas id` | qualquer participante | mostra o ID do grupo |
| `!alertas vincular <cidade>` | admin do grupo | o grupo passa a receber os alertas da cidade |
| `!alertas desvincular` | admin do grupo | o grupo deixa de receber alertas |
| `!alertas` | qualquer participante | mostra a ajuda |

Qualquer outra mensagem no grupo é ignorada pelo bot.

### Cuidados
- **Não feche o terminal do bot.** Os alertas só saem enquanto `node index.js` estiver rodando. Se ele ficar desligado, as mensagens esperam na fila e saem quando ele voltar. Isso vale para alertas ainda ativos: alertas encerrados ou cancelados no meio-tempo não são enviados.
- **O bot manda uma mensagem a cada 2 segundos** de propósito. Mandar muitas mensagens seguidas pode fazer o WhatsApp bloquear o número.
- **Um grupo por cidade.** O mesmo grupo pode ser vinculado a mais de uma cidade, se vocês quiserem um grupo regional.
