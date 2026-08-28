"use client";

import { useEffect, useRef } from "react";
import { markAllNotificationsReadAction } from "@/lib/actions/notification-actions";

// "Ao abrir: is_read = true" (item 37) — dispara uma vez só quando a
// tela de notificações é aberta.
export function MarkReadOnMount({ path, hasUnread }: { path: string; hasUnread: boolean }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !hasUnread) return;
    firedRef.current = true;
    markAllNotificationsReadAction(path);
  }, [path, hasUnread]);

  return null;
}
