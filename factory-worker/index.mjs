import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function processQueue() {

  console.log('AI Factory Worker iniciado')

  const { data: tasks, error } = await supabase
    .from('ai_execution_queue')
    .select('*')
    .eq('status', 'pendente')
    .limit(5)

  if (error) {
    console.error(error)
    return
  }

  if (!tasks?.length) {
    console.log('Sem tarefas pendentes')
    return
  }

  for (const task of tasks) {

    console.log('Processando:', task.task_title)

    await supabase
      .from('ai_execution_queue')
      .update({ status: 'analisando' })
      .eq('id', task.id)

    const analysis = `
Projeto: ${task.project_name}
Arquivo: ${task.target_file}

Diagnóstico automático iniciado.
`

    await supabase
      .from('ai_execution_logs')
      .insert({
        queue_id: task.id,
        project_name: task.project_name,
        repository: task.repository,
        target_file: task.target_file,
        analysis,
        execution_status: 'analisado'
      })

    await supabase
      .from('ai_execution_queue')
      .update({ status: 'analisado' })
      .eq('id', task.id)
  }
}

setInterval(processQueue, 15000)
processQueue()
