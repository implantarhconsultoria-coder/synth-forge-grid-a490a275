# LOVABLE FACTORY BRIDGE

Status: ponte operacional definida.

Objetivo:
Permitir que a AI Factory trate missoes do tipo Lovable como criacao ou edicao de projeto.

Fluxo:
1. Factory recebe tarefa com type lovable_project.
2. Factory valida nome, objetivo e prompt.
3. Factory registra pacote em factory-output.
4. Execucao real depende de executor externo autorizado para Lovable.

Campos da tarefa:
- type: lovable_project
- action: create_project ou edit_project
- projectName
- prompt
- workspaceName
- lovableProjectId opcional para edicao

Observacao importante:
O conector Lovable usado dentro do ChatGPT criou o projeto VIDEO HUB, mas o worker Node da Factory ainda nao possui credencial propria/API publica do Lovable para criar projetos sem intermediario.

Proximo passo:
Acoplar um executor Lovable autorizado quando houver token/API/endpoint oficial disponivel para ambiente externo.
