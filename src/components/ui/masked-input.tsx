"use client";

import * as React from "react";
import { Input } from "./field";

function formatCPF(d: string) {
  let out = d.slice(0, 3);
  if (d.length > 3) out += "." + d.slice(3, 6);
  if (d.length > 6) out += "." + d.slice(6, 9);
  if (d.length > 9) out += "-" + d.slice(9, 11);
  return out;
}

function formatCNPJ(d: string) {
  let out = d.slice(0, 2);
  if (d.length > 2) out += "." + d.slice(2, 5);
  if (d.length > 5) out += "." + d.slice(5, 8);
  if (d.length > 8) out += "/" + d.slice(8, 12);
  if (d.length > 12) out += "-" + d.slice(12, 14);
  return out;
}

export function DocumentoInput({
  id,
  name,
  defaultValue,
}: {
  id?: string;
  name: string;
  defaultValue?: string | null;
}) {
  const [digits, setDigits] = React.useState(() =>
    (defaultValue ?? "").replace(/\D/g, "").slice(0, 14)
  );
  const formatted = digits.length > 11 ? formatCNPJ(digits) : formatCPF(digits);

  return (
    <Input
      id={id}
      name={name}
      value={formatted}
      onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 14))}
      placeholder="CPF ou CNPJ"
    />
  );
}

function formatTelefone(d: string) {
  let out = d.slice(0, 2);
  if (d.length > 2) out += " " + d.slice(2, 7);
  if (d.length > 7) out += "-" + d.slice(7, 11);
  return out;
}

export function TelefoneInput({
  id,
  name,
  defaultValue,
}: {
  id?: string;
  name: string;
  defaultValue?: string | null;
}) {
  const [digits, setDigits] = React.useState(() =>
    (defaultValue ?? "").replace(/\D/g, "").slice(0, 11)
  );
  const formatted = formatTelefone(digits);

  return (
    <Input
      id={id}
      name={name}
      value={formatted}
      onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 11))}
      placeholder="XX XXXXX-XXXX"
    />
  );
}
