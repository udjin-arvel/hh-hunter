import { useEffect, useRef, useState } from "react";

import { isInformativeText } from "@/lib/html";
import { useAppStore } from "@/lib/store";

import { PrivacyNotice } from "./PrivacyNotice";

const MIN_RESUME_CHARS = 100;
const LARGE_PASTE_CHARS = 200;
const SAVE_DEBOUNCE_MS = 500;

type ProfileEditMode = "edit" | "process";

export function ProfileTab() {
  const isHydrated = useAppStore((state) => state.isHydrated);
  const portfolioText = useAppStore((state) => state.profile.portfolioText);
  const processProfile = useAppStore((state) => state.processProfile);
  const saveProfileText = useAppStore((state) => state.saveProfileText);
  const clearProfile = useAppStore((state) => state.clearProfile);
  const isProcessing = useAppStore((state) => state.isProcessingProfile);
  const processError = useAppStore((state) => state.profileProcessError);
  const isSaving = useAppStore((state) => state.isSaving);
  const saveError = useAppStore((state) => state.saveError);

  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<ProfileEditMode>("process");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    setDraft(portfolioText);
    setMode(portfolioText.trim() ? "edit" : "process");
  }, [isHydrated, portfolioText]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const scheduleLocalSave = (text: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void saveProfileText(text);
    }, SAVE_DEBOUNCE_MS);
  };

  const handleChange = (value: string) => {
    setDraft(value);

    if (mode === "edit") {
      if (!value.trim()) {
        setMode("process");
        return;
      }

      scheduleLocalSave(value);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");

    if (mode === "edit" && pasted.length >= LARGE_PASTE_CHARS) {
      setMode("process");
    }
  };

  const canProcess =
    mode === "process" &&
    isInformativeText(draft.trim(), MIN_RESUME_CHARS) &&
    !isProcessing &&
    !isSaving;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-1 text-[11px] text-muted-foreground">Текст резюме</div>
        <textarea
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onPaste={handlePaste}
          placeholder="Вставьте полный текст резюме с hh.ru или из файла…"
          className="min-h-[240px] flex-1 resize-y rounded-xl border border-border bg-background px-3 py-2 text-[12px] leading-relaxed outline-none placeholder:text-muted-foreground focus:border-foreground"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          {mode === "process"
            ? "Новый текст будет сжат через LLM и сохранён."
            : "Правки сохраняются локально, в LLM не отправляются."}
        </p>
      </div>

      <PrivacyNotice variant="short" />

      {processError && <p className="text-[11px] text-red-600">{processError}</p>}
      {saveError && <p className="text-[11px] text-red-600">{saveError}</p>}

      <button
        type="button"
        disabled={!canProcess}
        onClick={() => void processProfile(draft)}
        className="w-full rounded-xl bg-primary py-2.5 text-[13px] text-primary-foreground disabled:opacity-60"
      >
        {isProcessing ? "Обработка…" : "Обработать и сохранить"}
      </button>

      <button
        type="button"
        disabled={isSaving || isProcessing}
        onClick={() => void clearProfile()}
        className="w-full rounded-xl border border-border bg-background py-2.5 text-[13px] text-foreground disabled:opacity-60"
      >
        Очистить
      </button>
    </div>
  );
}
