import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
      <Card className="mt-6 flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/15">
          <Construction className="h-6 w-6 text-brand" />
        </div>
        <p className="font-semibold text-foreground">Em construção — {phase}</p>
        <p className="max-w-sm text-sm text-muted">{description}</p>
      </Card>
    </div>
  );
}
