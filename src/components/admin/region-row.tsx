"use client";

import { useState, useTransition } from "react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toggleRegionActiveAction, updateRegionAction } from "@/lib/actions/admin-actions";

export function RegionRow({
  id,
  name,
  isActive,
}: {
  id: string;
  name: string;
  isActive: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("name", value);
    startTransition(async () => {
      const result = await updateRegionAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setError(null);
      setEditing(false);
    });
  }

  return (
    <Card className="flex items-center justify-between gap-3">
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <Input value={value} onChange={(e) => setValue(e.target.value)} className="h-9" />
          <Button size="sm" disabled={pending} onClick={handleSave}>
            Salvar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setValue(name);
              setEditing(false);
              setError(null);
            }}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium text-foreground">{name}</p>
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "success" : "muted"}>{isActive ? "Ativo" : "Inativo"}</Badge>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isActive ? "danger" : "secondary"}
              disabled={pending}
              onClick={() => startTransition(() => toggleRegionActiveAction(id, !isActive))}
            >
              {isActive ? "Desativar" : "Ativar"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
