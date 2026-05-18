import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { factoryData } from "@/lib/factory-data";
import { toast } from "sonner";
import { Rocket, Loader2, Mic, MicOff, Paperclip, X, FileText, Image as ImageIcon, Film, Music } from "lucide-react";
import { classifyMission, actionLabel, riskColor, type ClassifiedMission } from "@/lib/mission-classifier";
import { notify } from "@/lib/notifications";
import { getSettings } from "@/lib/factory-settings";

type Attachment = { id: string; file: File; kind: "image" | "video" | "audio" | "pdf" | "file" };

function kindOf(file: File): Attachment["kind"] {
  const t = file.type;
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (t === "application/pdf") return "pdf";
  return "file";
}

const kindIcon = { image: ImageIcon, video: Film, audio: Music, pdf: FileText, file: FileText };

export function MissionModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [files, setFiles] = useState<Attachment[]>([]);
  const recogRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmed = command.trim();
  const classification: ClassifiedMission | null = trimmed ? classifyMission(trimmed) : null;

  // Voice recognition
  useEffect(() => {
    if (!open) {
      stopListening();
      return;
    }
  }, [open]);

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Reconhecimento de voz não disponível neste navegador.");
      return;
    }
    const r = new SR();
    r.lang = "pt-BR";
    r.continuous = true;
    r.interimResults = true;
    let finalText = command ? command + " " : "";
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += txt + " ";
        else interim += txt;
      }
      setCommand((finalText + interim).replace(/\s+/g, " "));
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    try {
      r.start();
      recogRef.current = r;
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function stopListening() {
    try { recogRef.current?.stop?.(); } catch {}
    recogRef.current = null;
    setListening(false);
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    const next: Attachment[] = list.slice(0, 10).map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      kind: kindOf(f),
    }));
    setFiles((prev) => [...prev, ...next].slice(0, 10));
    e.target.value = "";
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function submit() {
    if (!trimmed) {
      toast.error("Fale ou digite sua missão.");
      return;
    }
    stopListening();
    setLoading(true);
    try {
      const c = classifyMission(trimmed);
      const settings = getSettings();
      const project = settings.defaultProject || c.project;

      const objective = [
        `[${actionLabel(c.action).toUpperCase()}] ${c.raw}`,
        `Projeto: ${project}`,
        `Prioridade: ${c.priority} · Risco: ${c.risk}${c.requiresApproval ? " · Aprovação necessária" : ""}`,
        c.tags.length ? `Tags: ${c.tags.join(", ")}` : "",
        files.length ? `Anexos: ${files.map((f) => `${f.file.name} (${f.kind})`).join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const title = c.raw.length > 60 ? c.raw.slice(0, 57) + "..." : c.raw;

      await factoryData.createExecutionMission({ title, objective, project });

      await notify({
        kind: "mission_created",
        title: "Missão criada",
        body: `${actionLabel(c.action)} · ${project}`,
      });

      toast.success("Missão enviada ao núcleo IA");
      setCommand("");
      setFiles([]);
      onOpenChange(false);
    } catch {
      toast.error("Falha ao enviar missão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopListening(); onOpenChange(v); }}>
      <DialogContent className="glass border-primary/30 max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="size-5 text-primary" /> Missão
          </DialogTitle>
          <DialogDescription>
            A IA identifica projeto, ação, risco e prioridade automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <textarea
            autoFocus
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            rows={5}
            placeholder="Fale ou digite sua missão…"
            className="w-full rounded-xl bg-secondary/60 border border-border/60 px-4 py-3 text-base focus:border-primary outline-none resize-none"
          />

          {/* Classification preview */}
          {classification && (
            <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-xs flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 font-semibold">
                {actionLabel(classification.action)}
              </span>
              <span className="rounded-full bg-accent/15 text-accent px-2 py-0.5">
                {classification.project}
              </span>
              <span className={`rounded-full bg-foreground/5 px-2 py-0.5 ${riskColor(classification.risk)}`}>
                risco {classification.risk}
              </span>
              <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-muted-foreground">
                {classification.priority}
              </span>
              {classification.requiresApproval && (
                <span className="rounded-full bg-warning/15 text-warning px-2 py-0.5">aprovação</span>
              )}
              {classification.tags.map((t) => (
                <span key={t} className="rounded-full bg-foreground/5 px-2 py-0.5 text-muted-foreground">#{t}</span>
              ))}
            </div>
          )}

          {/* Attachments */}
          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f) => {
                const Icon = kindIcon[f.kind];
                return (
                  <li key={f.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-xs">
                    <Icon className="size-4 text-primary shrink-0" />
                    <span className="truncate flex-1">{f.file.name}</span>
                    <span className="text-muted-foreground">{(f.file.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Actions */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.csv,.json"
            className="hidden"
            onChange={onPickFiles}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 py-3 text-sm hover:border-primary/50"
            >
              <Paperclip className="size-4" /> Anexar
            </button>
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition ${
                listening
                  ? "bg-destructive/15 border border-destructive/40 text-destructive animate-pulse"
                  : "bg-background/40 border border-border/60 hover:border-primary/50"
              }`}
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              {listening ? "Gravando…" : "Voz"}
            </button>
          </div>

          <button
            onClick={submit}
            disabled={loading || !trimmed}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-4 text-base font-bold text-primary-foreground glow-border disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Rocket className="size-5" />}
            Enviar missão
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
