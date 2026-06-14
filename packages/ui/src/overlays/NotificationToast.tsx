import { useEffect, useState } from "react";

let listeners: Array<(message: string) => void> = [];

export function showNotification(message: string): void {
  for (const listener of listeners) listener(message);
}

export function NotificationToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onMessage = (next: string) => {
      setMessage(next);
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    };
    listeners.push(onMessage);
    return () => {
      listeners = listeners.filter((listener) => listener !== onMessage);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="fixed bottom-10 right-4 z-50 rounded-md border border-cs-border bg-cs-modal px-3 py-2 text-[12px] text-cs-primary shadow-lg">
      {message}
    </div>
  );
}
