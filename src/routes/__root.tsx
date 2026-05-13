import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-2xl p-10">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Sinal perdido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A rota solicitada não existe na malha da AI Factory.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Voltar ao Command Center
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-2xl p-10">
        <h1 className="text-xl font-semibold">Falha de subsistema</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI FACTORY — Command Center" },
      { name: "description", content: "Inteligência operacional by ImplantaRH ConsultoriaPRO Ltda. Crie, conecte, corrija e comande projetos com IA." },
      { property: "og:title", content: "AI FACTORY — Command Center" },
      { property: "og:description", content: "Inteligência operacional by ImplantaRH ConsultoriaPRO Ltda. Crie, conecte, corrija e comande projetos com IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AI FACTORY — Command Center" },
      { name: "twitter:description", content: "Inteligência operacional by ImplantaRH ConsultoriaPRO Ltda. Crie, conecte, corrija e comande projetos com IA." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/yi66kl3VLXPqQ4GBT7xAnATAJOI2/social-images/social-1778639725246-2084FFDB-CB23-40B4-894B-B47DB3630CA2.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/yi66kl3VLXPqQ4GBT7xAnATAJOI2/social-images/social-1778639725246-2084FFDB-CB23-40B4-894B-B47DB3630CA2.webp" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
