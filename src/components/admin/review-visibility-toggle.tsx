"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleReviewVisibleAction } from "@/lib/actions/admin-actions";

export function ReviewVisibilityToggle({ reviewId, isVisible }: { reviewId: string; isVisible: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleReviewVisibleAction(reviewId, !isVisible);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={isVisible ? "outline" : "secondary"}
      disabled={pending}
      onClick={handleClick}
    >
      {isVisible ? "Ocultar" : "Reexibir"}
    </Button>
  );
}
