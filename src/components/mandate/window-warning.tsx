import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/kit";
import { activeMandate, spentInWindow, windowAlert } from "@/lib/mandate";
import { loadReceipts } from "@/lib/receipts";

export function WindowWarning() {
  const [level, setLevel] = useState<null | 80 | 95>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const mandate = activeMandate();
    const next = windowAlert(spentInWindow(mandate, loadReceipts()), mandate.window.amountUsd);
    setLevel(next);
    if (!next) return;
    const key = `${mandate.id}:${next}:${mandate.window.amountUsd}`;
    if (sessionStorage.getItem("fba-window-warn") === key) return;
    sessionStorage.setItem("fba-window-warn", key);
    setToast(next === 95 ? "95% of this spending window is used." : "80% of this spending window is used.");
  }, []);

  return (
    <>
      {level ? <Badge status={level === 95 ? "stop" : "ask"}>{level}% of window</Badge> : null}
      {toast ? (
        <p className="toast" role="status">
          {toast}
        </p>
      ) : null}
    </>
  );
}
