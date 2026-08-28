"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateReportStatusAction } from "@/lib/actions/admin-actions";

export function ReportStatusActions({ reportId, status }: { reportId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function set(next: "IN_REVIEW" | "RESOLVED" | "DISMISSED") {
    startTransition(async () => {
      await updateReportStatusAction(reportId, next);
      router.refresh();
    });
  }

  if (status === "RESOLVED" || status === "DISMISSED") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" && (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => set("IN_REVIEW")}>
          Marcar em análise
        </Button>
      )}
      <Button type="button" size="sm" disabled={pending} onClick={() => set("RESOLVED")}>
        Resolver
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => set("DISMISSED")}>
        Descartar
      </Button>
    </div>
  );
}
