"use client";

import * as React from "react";
import { Input } from "./field";

function formatCentsToBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CurrencyInput({
  id,
  name,
  defaultValue,
  className,
  autoFocus,
}: {
  id?: string;
  name: string;
  defaultValue?: string | number | null;
  className?: string;
  autoFocus?: boolean;
}) {
  const [cents, setCents] = React.useState(() => {
    const n = Number(defaultValue ?? 0);
    return Math.round(n * 100);
  });

  return (
    <>
      <input type="hidden" name={name} value={(cents / 100).toFixed(2)} />
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        className={className}
        autoFocus={autoFocus}
        value={formatCentsToBRL(cents)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setCents(digits === "" ? 0 : Number(digits));
        }}
      />
    </>
  );
}
