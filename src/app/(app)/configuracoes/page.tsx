import { auth } from "@/lib/auth";
import { getConfiguracao } from "@/lib/configuracao";
import { ConfiguracaoForm } from "./configuracao-form";

export default async function ConfiguracoesPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="mt-2 text-sm text-muted">
          Apenas administradores podem alterar as configurações.
        </p>
      </div>
    );
  }

  const configuracao = await getConfiguracao();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted">Dados da empresa e período do ano fiscal</p>
      </div>

      <ConfiguracaoForm
        nome={configuracao.nome}
        cnpj={configuracao.cnpj}
        endereco={configuracao.endereco}
        mesInicioAnoFiscal={configuracao.mesInicioAnoFiscal}
        hasLogo={Boolean(configuracao.logoPath)}
        logoVersion={configuracao.updatedAt.getTime().toString()}
      />
    </div>
  );
}
