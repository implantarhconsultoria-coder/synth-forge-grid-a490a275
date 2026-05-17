# AI FACTORY - DEPLOY 24H

Objetivo:
Deixar a AI Factory online continuamente.

Estrutura adicionada:
- Docker Compose
- Restart automatico
- Worker persistente
- Porta 8787
- Watchdog
- Volumes persistentes

Subir infraestrutura:

```bash
cp .env.example .env
docker compose -f docker-compose.factory.yml up -d
```

Status esperado:
- Worker online 24h
- API /status ativa
- API /fila ativa
- API /logs ativa
- Autopilot ativo
- Restart automatico em queda

Proximo passo:
Conectar dominio, proxy reverso e monitoramento.
