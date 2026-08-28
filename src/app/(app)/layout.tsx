import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getConfiguracao } from "@/lib/configuracao";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configuracao = await getConfiguracao();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        nome={configuracao.nome}
        hasLogo={Boolean(configuracao.logoPath)}
        logoVersion={configuracao.updatedAt.getTime().toString()}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
