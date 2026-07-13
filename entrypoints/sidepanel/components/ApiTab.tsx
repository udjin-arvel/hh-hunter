import { useAppStore } from "@/lib/store";

import { Field } from "./Field";

export function ApiTab() {
  const apiKey = useAppStore((state) => state.apiKey);
  const setApiKey = useAppStore((state) => state.setApiKey);
  const saveApiKey = useAppStore((state) => state.saveApiKey);
  const isSaving = useAppStore((state) => state.isSaving);

  return (
    <div className="space-y-3">
      <Field
        label="DeepSeek API Key"
        placeholder="sk-••••••••••••••••"
        value={apiKey}
        onChange={setApiKey}
        mono
      />
      <div className="rounded-xl border border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
        Ключ никуда не отправляется, кроме{" "}
        <span className="font-mono text-foreground">api.deepseek.com</span>. Модель{" "}
        <span className="font-mono text-foreground">deepseek-chat</span>, температура 0.7.
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-[12px]">
        <span className="text-muted-foreground">Статус</span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
          не проверен
        </span>
      </div>
      <button
        type="button"
        disabled={isSaving}
        onClick={() => void saveApiKey()}
        className="w-full rounded-xl bg-primary py-2.5 text-[13px] text-primary-foreground disabled:opacity-60"
      >
        {isSaving ? "Сохранение…" : "Сохранить ключ"}
      </button>
    </div>
  );
}
