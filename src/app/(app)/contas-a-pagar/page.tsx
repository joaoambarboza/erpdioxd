import { ContasView } from "@/app/(app)/contas/contas-view";

export default async function ContasAPagarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ContasView tipo="SAIDA" params={await searchParams} />;
}
