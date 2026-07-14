import { useEffect } from "react";

import { useAppStore } from "@/lib/store";
import type { LetterLength, LetterStyle, ResponseFormat } from "@/lib/types";

import { GenerationProgress } from "./GenerationProgress";
import { ResultView } from "./ResultView";
import { Segmented } from "./Segmented";
import { VacancyCard } from "./VacancyCard";

function formatActiveTabUrl(url: string | null): string {
  if (!url) {
    return "Нет активной вкладки";
  }

  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function formatDuration(durationMs: number): string {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  return `${seconds} с`;
}

export function GeneratorTab() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const vacancy = useAppStore((state) => state.vacancy);
  const activeTabUrl = useAppStore((state) => state.activeTabUrl);
  const isHhVacancyTab = useAppStore((state) => state.isHhVacancyTab);
  const manualVacancyUrl = useAppStore((state) => state.manualVacancyUrl);
  const isFetchingVacancy = useAppStore((state) => state.isFetchingVacancy);
  const vacancyError = useAppStore((state) => state.vacancyError);
  const generationInputError = useAppStore((state) => state.generationInputError);
  const generationResult = useAppStore((state) => state.generationResult);
  const isGenerating = useAppStore((state) => state.isGenerating);
  const generationError = useAppStore((state) => state.generationError);
  const generationStage = useAppStore((state) => state.generationStage);
  const generationStartedAt = useAppStore((state) => state.generationStartedAt);
  const generationDurationMs = useAppStore((state) => state.generationDurationMs);
  const refreshActiveTabInfo = useAppStore((state) => state.refreshActiveTabInfo);
  const checkGenerationReadiness = useAppStore((state) => state.checkGenerationReadiness);
  const scanActiveTab = useAppStore((state) => state.scanActiveTab);
  const importVacancyFromUrl = useAppStore((state) => state.importVacancyFromUrl);
  const setManualVacancyUrl = useAppStore((state) => state.setManualVacancyUrl);
  const generateLetter = useAppStore((state) => state.generateLetter);
  const cancelGeneration = useAppStore((state) => state.cancelGeneration);

  const canGenerate = !generationInputError && !isGenerating;

  useEffect(() => {
    void refreshActiveTabInfo();
    checkGenerationReadiness();
  }, [refreshActiveTabInfo, checkGenerationReadiness]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface/60 p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Активная вкладка</span>
          {isHhVacancyTab ? (
            <span className="inline-flex items-center gap-1 text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              hh.ru/vacancy
            </span>
          ) : (
            <span className="text-muted-foreground">не вакансия HH</span>
          )}
        </div>
        <div className="truncate rounded-lg bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground">
          {formatActiveTabUrl(activeTabUrl)}
        </div>
        <button
          type="button"
          disabled={!isHhVacancyTab || isFetchingVacancy}
          onClick={() => void scanActiveTab()}
          className="mt-2 w-full rounded-xl bg-primary py-2.5 text-[13px] font-medium text-primary-foreground disabled:opacity-60"
        >
          {isFetchingVacancy ? "Загрузка…" : "Сканировать вакансию"}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface/60 p-3">
        <div className="mb-1 text-[11px] text-muted-foreground">Ссылка на вакансию</div>
        <input
          value={manualVacancyUrl}
          onChange={(event) => setManualVacancyUrl(event.target.value)}
          placeholder="https://hh.ru/vacancy/…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-foreground"
        />
        <button
          type="button"
          disabled={!manualVacancyUrl.trim() || isFetchingVacancy}
          onClick={() => void importVacancyFromUrl()}
          className="mt-2 w-full rounded-xl border border-border py-2 text-[12px] disabled:opacity-60"
        >
          Загрузить
        </button>
      </div>

      {vacancyError && <p className="text-[11px] text-red-600">{vacancyError}</p>}

      {vacancy && <VacancyCard vacancy={vacancy} />}

      <div className="space-y-2.5">
        <Segmented<ResponseFormat>
          label="Формат"
          value={settings.format}
          onChange={(format) => updateSettings({ format })}
          options={[
            ["theses", "Тезисы"],
            ["letter", "Готовое письмо"],
          ]}
        />
        <Segmented<LetterStyle>
          label="Стиль"
          value={settings.style}
          onChange={(style) => updateSettings({ style })}
          options={[
            ["conversational", "Разгов."],
            ["business", "Деловой"],
            ["metrics", "Цифры"],
          ]}
        />
        <Segmented<LetterLength>
          label="Длина"
          value={settings.length}
          onChange={(length) => updateSettings({ length })}
          options={[
            ["short", "Кратко"],
            ["medium", "Средне"],
            ["long", "Подробно"],
          ]}
        />
        <div>
          <div className="mb-1 text-[11px] text-muted-foreground">Дополнительный фокус</div>
          <input
            value={settings.focus}
            onChange={(event) => updateSettings({ focus: event.target.value })}
            placeholder="Напр. акцент на управлении командами…"
            maxLength={500}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-foreground"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {settings.format === "theses"
            ? "Кратко 4–6 тезисов · Средне 6–9 · Подробно 8–12"
            : "Кратко ~50 слов · Средне ~100 · Подробно ~180"}
        </p>
      </div>

      {generationInputError && <p className="text-[11px] text-amber-700">{generationInputError}</p>}

      <button
        type="button"
        disabled={!canGenerate}
        onClick={() => void generateLetter()}
        className="w-full rounded-xl bg-primary py-3 text-[13px] font-medium text-primary-foreground disabled:opacity-60"
      >
        {isGenerating ? "Генерация…" : "Сгенерировать письмо ↗"}
      </button>

      {generationError && <p className="text-[11px] text-red-600">{generationError}</p>}

      {isGenerating && (
        <GenerationProgress
          stage={generationStage}
          startedAt={generationStartedAt}
          onCancel={cancelGeneration}
        />
      )}

      {generationResult && !isGenerating && (
        <>
          {generationDurationMs !== null && (
            <p className="text-[10px] text-muted-foreground">
              Сгенерировано за {formatDuration(generationDurationMs)}
            </p>
          )}
          <ResultView result={generationResult} />
        </>
      )}
    </div>
  );
}
