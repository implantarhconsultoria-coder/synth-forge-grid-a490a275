
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  repo text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  objective text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  module text,
  project text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_execution_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'project_update',
  status text NOT NULL DEFAULT 'pending',
  action text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error text,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS ai_execution_queue_status_idx ON public.ai_execution_queue(status, created_at);

CREATE TABLE IF NOT EXISTS public.smart_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'info',
  type text NOT NULL DEFAULT 'system',
  message text NOT NULL,
  project text,
  module text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS smart_logs_created_idx ON public.smart_logs(created_at DESC);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_execution_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "factory_read_projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "factory_insert_projects" ON public.projects FOR INSERT WITH CHECK (true);

CREATE POLICY "factory_read_missions" ON public.missions FOR SELECT USING (true);
CREATE POLICY "factory_insert_missions" ON public.missions FOR INSERT WITH CHECK (true);

CREATE POLICY "factory_read_queue" ON public.ai_execution_queue FOR SELECT USING (true);
CREATE POLICY "factory_insert_queue" ON public.ai_execution_queue FOR INSERT WITH CHECK (true);

CREATE POLICY "factory_read_logs" ON public.smart_logs FOR SELECT USING (true);
CREATE POLICY "factory_insert_logs" ON public.smart_logs FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_execution_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;
