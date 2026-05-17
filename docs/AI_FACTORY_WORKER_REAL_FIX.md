# AI Factory - Correção para execução real

Status: preparado.

O dashboard precisa deixar de mostrar apenas eventos simulados e passar a consultar o worker real nas rotas:

- GET /status
- GET /logs
- POST /fila
- GET /autopilot/start
- GET /autopilot/stop

Regras da correção:

1. Criar campo de URL do worker no painel.
2. Salvar essa URL no navegador.
3. Testar conexão em tempo real.
4. Exibir ONLINE somente quando /status responder.
5. Mostrar OFFLINE quando a chamada falhar.
6. Enviar missões reais para /fila.
7. Ler logs reais de /logs.
8. Não mostrar mais evento como executado se o worker não responder.

Critério de validação:

- Se o worker estiver parado, a tela deve mostrar WORKER OFFLINE.
- Se o worker estiver ativo, a tela deve mostrar REAL ONLINE.
- Ao enviar missão, ela deve aparecer no arquivo factory-data/execution-queue.json do worker.
- Os logs precisam vir do arquivo factory-data/execution-logs.json.

Próximo passo técnico:

Atualizar src/App.tsx para incluir cliente HTTP do worker e botões de controle real.
