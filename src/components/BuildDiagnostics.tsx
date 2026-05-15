import { GitBranch, GitCommit, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

declare const __BUILD_BRANCH__: string;
declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;

const BRANCH = typeof __BUILD_BRANCH__ !== "undefined" ? __BUILD_BRANCH__ : "unknown";
const COMMIT = typeof __BUILD_COMMIT__ !== "undefined" ? __BUILD_COMMIT__ : "unknown";
const BUILT_AT = typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : new Date().toISOString();

const SHORT = COMMIT && COMMIT !== "unknown" ? COMMIT.slice(0, 7) : "unknown";
const onMain = BRANCH === "main" || BRANCH === "master";

export function BuildDiagnostics() {
  return (
    <section className="rounded-xl glass overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 text-sm font-medium flex items-center justify-between">
        <span>Diagnóstico de build</span>
        {onMain ? (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="size-3.5" /> Sincronizado com main
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-warning">
            <AlertTriangle className="size-3.5" /> Possível divergência da main
          </span>
        )}
      </div>
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitBranch className="size-3.5" /> Branch
          </div>
          <div className="mt-2 font-mono text-sm">{BRANCH}</div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitCommit className="size-3.5" /> Commit
          </div>
          <div className="mt-2 font-mono text-sm" title={COMMIT}>
            {SHORT}
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> Build
          </div>
          <div className="mt-2 font-mono text-sm">
            {new Date(BUILT_AT).toLocaleString("pt-BR")}
          </div>
        </div>
      </div>
      {!onMain && (
        <div className="px-5 py-3 text-xs text-warning border-t border-warning/30 bg-warning/10">
          A build ativa não é da branch <span className="font-mono">main</span>. Verifique se o
          deploy foi promovido ou se existe código local divergente antes de validar correções.
        </div>
      )}
    </section>
  );
}
