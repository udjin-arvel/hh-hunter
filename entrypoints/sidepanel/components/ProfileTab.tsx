import { useEffect, useState } from "react";

import { isInformativeText } from "@/lib/html";
import { useAppStore } from "@/lib/store";

import { PrivacyNotice } from "./PrivacyNotice";

const MIN_RESUME_CHARS = 100;
const SAVE_TOAST_MS = 2_000;

export function ProfileTab() {
  const isHydrated = useAppStore((state) => state.isHydrated);
  const portfolioText = useAppStore((state) => state.profile.portfolioText);
  const technologiesToStudy = useAppStore((state) => state.profile.technologiesToStudy);
  const processProfile = useAppStore((state) => state.processProfile);
  const saveProfileText = useAppStore((state) => state.saveProfileText);
  const removeTechnologyToStudy = useAppStore((state) => state.removeTechnologyToStudy);
  const clearProfile = useAppStore((state) => state.clearProfile);
  const isProcessing = useAppStore((state) => state.isProcessingProfile);
  const processError = useAppStore((state) => state.profileProcessError);
  const isSaving = useAppStore((state) => state.isSaving);
  const saveError = useAppStore((state) => state.saveError);

  const [draft, setDraft] = useState("");
  const [saveToastVisible, setSaveToastVisible] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    setDraft(portfolioText);
  }, [isHydrated, portfolioText]);

  useEffect(() => {
    if (!saveToastVisible) {
      return;
    }

    const timer = setTimeout(() => {
      setSaveToastVisible(false);
    }, SAVE_TOAST_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [saveToastVisible]);

  const hasStoredResume = portfolioText.trim().length > 0;

  const canProcess =
    !hasStoredResume &&
    isInformativeText(draft.trim(), MIN_RESUME_CHARS) &&
    !isProcessing &&
    !isSaving;

  const canSaveLocal =
    hasStoredResume &&
    draft.trim().length > 0 &&
    draft !== portfolioText &&
    !isProcessing &&
    !isSaving;

  const handlePrimaryAction = async () => {
    if (hasStoredResume) {
      const saved = await saveProfileText(draft);

      if (saved) {
        setSaveToastVisible(true);
      }

      return;
    }

    await processProfile(draft);
  };

  const primaryDisabled = hasStoredResume ? !canSaveLocal : !canProcess;
  const primaryLabel = hasStoredResume
    ? isSaving
      ? "Сохранение…"
      : "Сохранить"
    : isProcessing
      ? "Обработка…"
      : "Обработать и сохранить";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-1 text-[11px] text-muted-foreground">Текст резюме</div>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Вставьте полный текст резюме с hh.ru или из файла…"
          className="min-h-[240px] flex-1 resize-y rounded-xl border border-border bg-background px-3 py-2 text-[12px] leading-relaxed outline-none placeholder:text-muted-foreground focus:border-foreground"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          {hasStoredResume
            ? "Правки сохраняйте кнопкой «Сохранить» — только локально, в LLM не отправляются."
            : "Новый текст будет сжат через LLM и сохранён."}
        </p>
      </div>

      <PrivacyNotice variant="short" />

      {processError && <p className="text-[11px] text-red-600">{processError}</p>}
      {saveError && <p className="text-[11px] text-red-600">{saveError}</p>}

      {saveToastVisible && (
        <div
          role="status"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-center text-[12px] text-foreground"
        >
          Резюме сохранено
        </div>
      )}

      <button
        type="button"
        disabled={primaryDisabled}
        onClick={() => void handlePrimaryAction()}
        className="w-full rounded-xl bg-primary py-2.5 text-[13px] text-primary-foreground disabled:opacity-60"
      >
        {primaryLabel}
      </button>

      <button
        type="button"
        disabled={isSaving || isProcessing}
        onClick={() => void clearProfile()}
        className="w-full rounded-xl border border-border bg-background py-2.5 text-[13px] text-foreground disabled:opacity-60"
      >
        Очистить
      </button>

      <div className="rounded-2xl border border-border p-3">
        <div className="mb-2 text-[11px] text-muted-foreground">Требуется изучить</div>
        {technologiesToStudy.length === 0 ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Появятся после генерации письма с включённой опцией «Технологии» на вкладке «Генератор».
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {technologiesToStudy.map((tech) => (
              <li key={tech}>
                <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-0.5 text-[11px]">
                  {tech}
                  <button
                    type="button"
                    aria-label={`Скрыть ${tech}`}
                    onClick={() => void removeTechnologyToStudy(tech)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
