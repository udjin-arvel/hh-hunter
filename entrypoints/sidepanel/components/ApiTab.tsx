import { useAppStore } from "@/lib/store";

import { Field } from "./Field";
import { PrivacyNotice } from "./PrivacyNotice";

export function ApiTab() {
  const apiKey = useAppStore((state) => state.apiKey);
  const setApiKey = useAppStore((state) => state.setApiKey);
  const saveApiKey = useAppStore((state) => state.saveApiKey);
  const verifyApiKey = useAppStore((state) => state.verifyApiKey);
  const isSaving = useAppStore((state) => state.isSaving);
  const isVerifyingApiKey = useAppStore((state) => state.isVerifyingApiKey);
  const apiKeyStatus = useAppStore((state) => state.apiKeyStatus);
  const apiKeyVerifyError = useAppStore((state) => state.apiKeyVerifyError);

  const statusLabel =
    apiKeyStatus === "valid" ? "проверен" : apiKeyStatus === "invalid" ? "неверный" : "не проверен";

  const statusColor =
    apiKeyStatus === "valid"
      ? "text-success"
      : apiKeyStatus === "invalid"
        ? "text-red-600"
        : "text-muted-foreground";

  const statusDot =
    apiKeyStatus === "valid"
      ? "bg-success"
      : apiKeyStatus === "invalid"
        ? "bg-red-600"
        : "bg-border";

  return (
    <div className="space-y-3">
      <Field
        label="DeepSeek API Key"
        placeholder="sk-••••••••••••••••"
        value={apiKey}
        onChange={setApiKey}
        mono
      />
      <PrivacyNotice variant="full" />
      <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-[12px]">
        <span className="text-muted-foreground">Статус</span>
        <span className={`inline-flex items-center gap-1.5 ${statusColor}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
          {statusLabel}
        </span>
      </div>
      {apiKeyVerifyError && <p className="text-[11px] text-red-600">{apiKeyVerifyError}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isVerifyingApiKey || !apiKey.trim()}
          onClick={() => void verifyApiKey()}
          className="flex-1 rounded-xl border border-border py-2.5 text-[13px] disabled:opacity-60"
        >
          {isVerifyingApiKey ? "Проверка…" : "Проверить ключ"}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void saveApiKey()}
          className="flex-1 rounded-xl bg-primary py-2.5 text-[13px] text-primary-foreground disabled:opacity-60"
        >
          {isSaving ? "Сохранение…" : "Сохранить ключ"}
        </button>
      </div>
    </div>
  );
}
