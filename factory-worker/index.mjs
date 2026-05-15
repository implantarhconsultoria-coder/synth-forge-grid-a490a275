import { createClient } from '@supabase/supabase-js'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const WORKSPACES_ROOT = process.env.WORKSPACES_ROOT || '/workspaces'
const DEFAULT_TOPAC_REPO = 'implantarhconsultoria-coder/rh-prospera-hub'
const DEFAULT_TOPAC_PROJECT_ROOT = `${WORKSPACES_ROOT}/rh-prospera-hub`
const RUN_ONCE = process.env.RUN_ONCE === 'true'

function safeJson(value, fallback = {}) {
  if (!value) return fallback
  if (typeof value === 'object') return value
  try { return JSON.parse(value) } catch { return fallback }
}

function normalizeRepository(repository) {
  if (!repository) return DEFAULT_TOPAC_REPO
  return String(repository)
    .replace('https://github.com/', '')
    .replace('git@github.com:', '')
    .replace(/\.git$/, '')
    .trim()
}

function buildCloneUrl(repository) {
  const repo = normalizeRepository(repository)
  const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (token) return `https://x-access-token:${token}@github.com/${repo}.git`
  return `https://github.com/${repo}.git`
}

async function runCommand(command, args, options = {}) {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: options.cwd || WORKSPACES_ROOT,
    timeout: options.timeout || 120000,
    maxBuffer: 1024 * 1024 * 8,
    env: process.env,
  })
  return `${stdout || ''}${stderr || ''}`.trim()
}

async function ensureProjectRepository(task) {
  const payload = safeJson(task.payload || task.task_payload || task.data, {})
  const repository = normalizeRepository(payload.repository || payload.repo || task.repository || DEFAULT_TOPAC_REPO)
  const projectRoot = payload.projectRoot || payload.project_root || task.project_root || DEFAULT_TOPAC_PROJECT_ROOT
  const branch = payload.branch || task.branch || 'main'
  const cloneUrl = buildCloneUrl(repository)

  await mkdir(WORKSPACES_ROOT, { recursive: true })

  if (!existsSync(projectRoot)) {
    const output = await runCommand('git', ['clone', '--branch', branch, cloneUrl, projectRoot], {
      cwd: WORKSPACES_ROOT,
      timeout: 180000,
    })
    return { repository, projectRoot, branch, action: 'cloned', output }
  }

  const fetchOutput = await runCommand('git', ['fetch', '--all', '--prune'], { cwd: projectRoot })
  const checkoutOutput = await runCommand('git', ['checkout', branch], { cwd: projectRoot })
  const pullOutput = await runCommand('git', ['pull', '--ff-only'], { cwd: projectRoot })

  return {
    repository,
    projectRoot,
    branch,
    action: 'updated',
    output: [fetchOutput, checkoutOutput, pullOutput].filter(Boolean).join('\n'),
  }
}

async function writeLog(task, fields) {
  await supabase.from('ai_execution_logs').insert({
    queue_id: task.id,
    project_name: task.project_name,
    repository: fields.repository || task.repository,
    target_file: task.target_file,
    analysis: fields.analysis,
    execution_status: fields.execution_status,
  })
}

async function processQueue() {
  console.log('AI Factory Worker iniciado')

  const { data: tasks, error } = await supabase
    .from('ai_execution_queue')
    .select('*')
    .eq('status', 'pendente')
    .limit(5)

  if (error) {
    console.error(error)
    if (RUN_ONCE) process.exitCode = 1
    return
  }

  if (!tasks?.length) {
    console.log('Sem tarefas pendentes')
    return
  }

  for (const task of tasks) {
    console.log('Processando:', task.task_title)

    await supabase.from('ai_execution_queue').update({ status: 'analisando' }).eq('id', task.id)

    try {
      const gitResult = await ensureProjectRepository(task)
      const analysis = `
Projeto: ${task.project_name || 'TOPAC RH'}
Repositorio: ${gitResult.repository}
ProjectRoot: ${gitResult.projectRoot}
Branch: ${gitResult.branch}
Acao Git: ${gitResult.action}
Arquivo alvo: ${task.target_file || 'nao informado'}

Resultado Git:
${gitResult.output || 'Sem saida do Git'}

GitHub Actions preparou o projeto real sem depender do Codespaces no celular.
`

      await writeLog(task, {
        repository: gitResult.repository,
        analysis,
        execution_status: 'repo_pronto',
      })

      await supabase.from('ai_execution_queue').update({
        status: 'repo_pronto',
        repository: gitResult.repository,
        project_root: gitResult.projectRoot,
      }).eq('id', task.id)
    } catch (err) {
      const message = err?.message || String(err)
      console.error('Falha ao preparar repositorio:', message)

      await writeLog(task, {
        repository: task.repository || DEFAULT_TOPAC_REPO,
        analysis: `Falha ao preparar repositorio real.\n\nErro:\n${message}`,
        execution_status: 'erro_git',
      })

      await supabase.from('ai_execution_queue').update({ status: 'erro_git' }).eq('id', task.id)
      if (RUN_ONCE) process.exitCode = 1
    }
  }
}

if (RUN_ONCE) {
  await processQueue()
} else {
  setInterval(processQueue, 15000)
  processQueue()
}
