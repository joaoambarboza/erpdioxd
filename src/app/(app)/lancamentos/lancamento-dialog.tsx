"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Checkbox, FieldGroup, Input, Select, Textarea } from "@/components/ui/field";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  tipoLabels,
  naturezaLabels,
  statusLabels,
  formaPagamentoLabels,
} from "@/lib/enum-labels";
import { createLancamento, updateLancamento, type ActionState } from "./actions";
import { AnexosSection } from "./anexos-section";
import { X } from "lucide-react";

type Option = { id: string; nome: string };

export type LancamentoOptions = {
  categorias: { id: string; nome: string; tipo: "ENTRADA" | "SAIDA"; parentId: string | null }[];
  contasDre: { id: string; nome: string; grupoNome: string }[];
  centrosCusto: Option[];
  regionais: Option[];
  contasBancarias: Option[];
  clientes: Option[];
  fornecedores: Option[];
};

export type LancamentoInitial = {
  id: string;
  dataLancamento: string;
  dataCompetencia: string;
  dataVencimento: string;
  dataPagamento: string | null;
  tipo: string;
  natureza: string;
  status: string;
  descricao: string;
  valorOriginal: string;
  desconto: string;
  acrescimo: string;
  juros: string;
  multa: string;
  valorPago: string;
  categoriaId: string;
  subcategoriaId: string | null;
  contaDreId: string;
  centroCustoId: string;
  regionalId: string;
  projeto: string | null;
  contaBancariaId: string;
  clienteId: string | null;
  fornecedorId: string | null;
  formaPagamento: string;
  tipoPagamento: string | null;
  observacao: string | null;
  numeroDocumento: string | null;
  numeroNotaFiscal: string | null;
  recorrenciaId: string | null;
  parcelaNumero: number | null;
  anexos: { id: string; nomeArquivo: string; tamanho: number }[];
};

const initialState: ActionState = {};

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function LancamentoDialog({
  options,
  initial,
  trigger,
  defaultStatus = "EM_ABERTO",
}: {
  options: LancamentoOptions;
  initial?: LancamentoInitial;
  trigger?: React.ReactNode;
  defaultStatus?: LancamentoInitial["status"];
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(initial);
  const action = isEdit
    ? updateLancamento.bind(null, initial!.id)
    : createLancamento;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tipo, setTipo] = React.useState(initial?.tipo ?? "ENTRADA");
  const [categoriaId, setCategoriaId] = React.useState(
    initial?.categoriaId ?? ""
  );
  const [recorrente, setRecorrente] = React.useState(false);
  const [recorrenciaMeses, setRecorrenciaMeses] = React.useState("");
  const [recorrenciaDia, setRecorrenciaDia] = React.useState("");
  // Token da requisição de criação: reenvios do mesmo formulário não duplicam a série.
  // Gerado ao abrir (a cada abertura é uma nova requisição lógica).
  const [recorrenciaChave, setRecorrenciaChave] = React.useState("");
  const [novosAnexos, setNovosAnexos] = React.useState<File[]>([]);
  const novosAnexosInputRef = React.useRef<HTMLInputElement>(null);

  function syncNovosAnexosInput(files: File[]) {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (novosAnexosInputRef.current) {
      novosAnexosInputRef.current.files = dt.files;
    }
  }

  const wasPending = React.useRef(false);
  React.useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const categoriasRaiz = options.categorias.filter(
    (c) => !c.parentId && c.tipo === tipo
  );
  const subcategorias = options.categorias.filter(
    (c) => c.parentId === categoriaId
  );

  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <>
      <span
        onClick={() => {
          setRecorrente(false);
          setRecorrenciaMeses("");
          setRecorrenciaDia("");
          setRecorrenciaChave(crypto.randomUUID());
          setOpen(true);
        }}
      >
        {trigger ?? (
          <Button>
            <Plus size={16} />
            Novo Lançamento
          </Button>
        )}
      </span>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "Editar Lançamento" : "Novo Lançamento"}
        wide
      >
        <form action={formAction} className="flex flex-col gap-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">
              Identificação
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FieldGroup label="Data do lançamento" htmlFor="dataLancamento">
                <Input
                  id="dataLancamento"
                  name="dataLancamento"
                  type="date"
                  required
                  defaultValue={toDateInput(initial?.dataLancamento ?? null) || new Date().toISOString().slice(0, 10)}
                />
              </FieldGroup>
              <FieldGroup label="Data de competência" htmlFor="dataCompetencia">
                <Input
                  id="dataCompetencia"
                  name="dataCompetencia"
                  type="date"
                  required
                  defaultValue={toDateInput(initial?.dataCompetencia ?? null) || new Date().toISOString().slice(0, 10)}
                />
              </FieldGroup>
              <FieldGroup label="Data de vencimento" htmlFor="dataVencimento">
                <Input
                  id="dataVencimento"
                  name="dataVencimento"
                  type="date"
                  required
                  defaultValue={toDateInput(initial?.dataVencimento ?? null) || new Date().toISOString().slice(0, 10)}
                />
              </FieldGroup>
              <FieldGroup label="Pagamento/recebimento" htmlFor="dataPagamento">
                <Input
                  id="dataPagamento"
                  name="dataPagamento"
                  type="date"
                  defaultValue={toDateInput(initial?.dataPagamento ?? null)}
                />
              </FieldGroup>

              <FieldGroup label="Tipo" htmlFor="tipo">
                <Select
                  id="tipo"
                  name="tipo"
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value);
                    setCategoriaId("");
                  }}
                >
                  {Object.entries(tipoLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Natureza" htmlFor="natureza">
                <Select id="natureza" name="natureza" defaultValue={initial?.natureza ?? "RECEITA"}>
                  {Object.entries(naturezaLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={initial?.status ?? defaultStatus}>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Descrição" htmlFor="descricao" className="sm:col-span-2 lg:col-span-1">
                <Input
                  id="descricao"
                  name="descricao"
                  required
                  defaultValue={initial?.descricao}
                  placeholder="Ex: Venda de insumos"
                />
                {fieldError("descricao") && (
                  <p className="text-xs text-saida">{fieldError("descricao")}</p>
                )}
              </FieldGroup>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">Valores</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <FieldGroup label="Valor original" htmlFor="valorOriginal">
                <CurrencyInput id="valorOriginal" name="valorOriginal" defaultValue={initial?.valorOriginal} />
                {fieldError("valorOriginal") && (
                  <p className="text-xs text-saida">{fieldError("valorOriginal")}</p>
                )}
              </FieldGroup>
              <FieldGroup label="Desconto" htmlFor="desconto">
                <CurrencyInput id="desconto" name="desconto" defaultValue={initial?.desconto ?? "0"} />
              </FieldGroup>
              <FieldGroup label="Acréscimo" htmlFor="acrescimo">
                <CurrencyInput id="acrescimo" name="acrescimo" defaultValue={initial?.acrescimo ?? "0"} />
              </FieldGroup>
              <FieldGroup label="Juros" htmlFor="juros">
                <CurrencyInput id="juros" name="juros" defaultValue={initial?.juros ?? "0"} />
              </FieldGroup>
              <FieldGroup label="Multa" htmlFor="multa">
                <CurrencyInput id="multa" name="multa" defaultValue={initial?.multa ?? "0"} />
              </FieldGroup>
              <FieldGroup label="Pago/recebido" htmlFor="valorPago">
                <CurrencyInput id="valorPago" name="valorPago" defaultValue={initial?.valorPago ?? "0"} />
              </FieldGroup>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">
              Classificação
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldGroup label="Categoria" htmlFor="categoriaId">
                <Select
                  id="categoriaId"
                  name="categoriaId"
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {categoriasRaiz.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Subcategoria" htmlFor="subcategoriaId">
                <Select id="subcategoriaId" name="subcategoriaId" defaultValue={initial?.subcategoriaId ?? ""}>
                  <option value="">Nenhuma</option>
                  {subcategorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Conta do DRE" htmlFor="contaDreId">
                <Select id="contaDreId" name="contaDreId" required defaultValue={initial?.contaDreId}>
                  <option value="">Selecione</option>
                  {options.contasDre.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grupoNome} · {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Centro de custo" htmlFor="centroCustoId">
                <Select id="centroCustoId" name="centroCustoId" required defaultValue={initial?.centroCustoId}>
                  <option value="">Selecione</option>
                  {options.centrosCusto.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Regional" htmlFor="regionalId">
                <Select id="regionalId" name="regionalId" required defaultValue={initial?.regionalId}>
                  <option value="">Selecione</option>
                  {options.regionais.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Projeto" htmlFor="projeto">
                <Input id="projeto" name="projeto" defaultValue={initial?.projeto ?? ""} />
              </FieldGroup>
              <FieldGroup label="Conta bancária" htmlFor="contaBancariaId">
                <Select id="contaBancariaId" name="contaBancariaId" required defaultValue={initial?.contaBancariaId}>
                  <option value="">Selecione</option>
                  {options.contasBancarias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Cliente" htmlFor="clienteId">
                <Select id="clienteId" name="clienteId" defaultValue={initial?.clienteId ?? ""}>
                  <option value="">Nenhum</option>
                  {options.clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Fornecedor" htmlFor="fornecedorId">
                <Select id="fornecedorId" name="fornecedorId" defaultValue={initial?.fornecedorId ?? ""}>
                  <option value="">Nenhum</option>
                  {options.fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Forma de pagamento" htmlFor="formaPagamento">
                <Select id="formaPagamento" name="formaPagamento" defaultValue={initial?.formaPagamento ?? "PIX"}>
                  {Object.entries(formaPagamentoLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Tipo de pagamento" htmlFor="tipoPagamento">
                <Input id="tipoPagamento" name="tipoPagamento" defaultValue={initial?.tipoPagamento ?? ""} placeholder="Ex: À vista, parcelado" />
              </FieldGroup>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">
              Observações
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldGroup label="Número do documento" htmlFor="numeroDocumento">
                <Input id="numeroDocumento" name="numeroDocumento" defaultValue={initial?.numeroDocumento ?? ""} />
              </FieldGroup>
              <FieldGroup label="Número da nota fiscal" htmlFor="numeroNotaFiscal">
                <Input id="numeroNotaFiscal" name="numeroNotaFiscal" defaultValue={initial?.numeroNotaFiscal ?? ""} />
              </FieldGroup>
              <FieldGroup label="Observação" htmlFor="observacao" className="sm:col-span-2">
                <Textarea id="observacao" name="observacao" rows={3} defaultValue={initial?.observacao ?? ""} />
              </FieldGroup>
            </div>
          </section>

          {!isEdit && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-muted">Recorrência</h3>
              <Checkbox
                label="Lançamento recorrente"
                name="recorrente"
                checked={recorrente}
                onChange={(e) => setRecorrente(e.target.checked)}
              />
              {recorrente && (
                <>
                  <input type="hidden" name="recorrenciaChave" value={recorrenciaChave} />
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldGroup label="Quantidade de meses" htmlFor="recorrenciaMeses">
                      <Input
                        id="recorrenciaMeses"
                        name="recorrenciaMeses"
                        type="number"
                        inputMode="numeric"
                        min={2}
                        max={60}
                        step={1}
                        required
                        value={recorrenciaMeses}
                        onChange={(e) => setRecorrenciaMeses(e.target.value)}
                        placeholder="Ex: 12"
                      />
                      {fieldError("recorrenciaMeses") && (
                        <p className="text-xs text-saida">{fieldError("recorrenciaMeses")}</p>
                      )}
                    </FieldGroup>
                    <FieldGroup label="Dia do mês dos próximos vencimentos" htmlFor="recorrenciaDia">
                      <Input
                        id="recorrenciaDia"
                        name="recorrenciaDia"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={31}
                        step={1}
                        required
                        value={recorrenciaDia}
                        onChange={(e) => setRecorrenciaDia(e.target.value)}
                        placeholder="Ex: 5"
                      />
                      {fieldError("recorrenciaDia") && (
                        <p className="text-xs text-saida">{fieldError("recorrenciaDia")}</p>
                      )}
                    </FieldGroup>
                  </div>
                  {fieldError("recorrenciaChave") && (
                    <p className="mt-1 text-xs text-saida">{fieldError("recorrenciaChave")}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    A quantidade inclui este lançamento (de 2 a 60), que mantém as datas informadas. Os demais são
                    gerados mês a mês, em aberto, no dia escolhido (em meses mais curtos, no último dia do mês).
                  </p>
                </>
              )}
            </section>
          )}

          {!isEdit && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-muted">Anexos</h3>
              {novosAnexos.length > 0 && (
                <ul className="mb-3 flex flex-col gap-2">
                  {novosAnexos.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-muted hover:bg-saida-bg hover:text-saida"
                        aria-label="Remover"
                        onClick={() => {
                          const next = novosAnexos.filter((_, idx) => idx !== i);
                          setNovosAnexos(next);
                          syncNovosAnexosInput(next);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={novosAnexosInputRef}
                type="file"
                name="anexosNovos"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  const added = Array.from(e.target.files ?? []);
                  if (added.length === 0) return;
                  const next = [...novosAnexos, ...added];
                  setNovosAnexos(next);
                  syncNovosAnexosInput(next);
                }}
                className="flex-1 text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              <p className="mt-1 text-xs text-muted">
                PDF, imagem ou documento do Office. Máximo 10MB cada — anexados ao salvar.
              </p>
            </section>
          )}

          {state.error && (
            <p className="rounded-md bg-saida-bg px-3 py-2 text-sm text-saida">
              {state.error}
            </p>
          )}

          {isEdit && initial?.recorrenciaId && (
            <fieldset className="rounded-md border border-border px-3 py-2">
              <legend className="px-1 text-sm font-medium text-foreground">
                Este lançamento faz parte de uma recorrência
              </legend>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-6">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="radio" name="escopo" value="este" defaultChecked />
                  Aplicar somente a este lançamento
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="radio" name="escopo" value="seguintes" />
                  Aplicar a este e aos seguintes
                </label>
              </div>
              <p className="mt-1 text-xs text-muted">
                &quot;Este e os seguintes&quot; atualiza classificação e valores dos lançamentos seguintes; datas, status,
                descrição, documento e NF de cada um não mudam.
              </p>
            </fieldset>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>

        {isEdit && (
          <div className="mt-6 border-t border-border pt-6">
            <AnexosSection lancamentoId={initial!.id} anexos={initial?.anexos ?? []} />
          </div>
        )}
      </Modal>
    </>
  );
}
