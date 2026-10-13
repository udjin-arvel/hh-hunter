import { useCallback, useEffect, useRef, useState } from "react";

import { sortExamplesForPicker, useAppStore } from "@/lib/store";
import type { FantasyLevel, LetterLength } from "@/lib/types";

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
  const examples = useAppStore((state) => state.examples);
  const toggleExampleSelection = useAppStore((state) => state.toggleExampleSelection);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const vacancy = useAppStore((state) => state.vacancy);
  const activeTabUrl = useAppStore((state) => state.activeTabUrl);
  const isHhVacancyTab = useAppStore((state) => state.isHhVacancyTab);
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
  const generateLetter = useAppStore((state) => state.generateLetter);
  const cancelGeneration = useAppStore((state) => state.cancelGeneration);

  const canGenerate = !generationInputError && !isGenerating;
  const pickerExamples = sortExamplesForPicker(examples);
  const [isRefreshingActiveTab, setIsRefreshingActiveTab] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleRefreshActiveTab = useCallback(async () => {
    setIsRefreshingActiveTab(true);
    try {
      await refreshActiveTabInfo();
    } finally {
      setIsRefreshingActiveTab(false);
    }
  }, [refreshActiveTabInfo]);

  useEffect(() => {
    void refreshActiveTabInfo();
    checkGenerationReadiness();

    const onBrowserTabChange = () => {
      void refreshActiveTabInfo();
    };

    const onBrowserTabUpdated = (
      _tabId: number,
      changeInfo: { url?: string },
    ) => {
      if (changeInfo.url !== undefined) {
        onBrowserTabChange();
      }
    };

    browser.tabs.onActivated.addListener(onBrowserTabChange);
    browser.tabs.onUpdated.addListener(onBrowserTabUpdated);

    return () => {
      browser.tabs.onActivated.removeListener(onBrowserTabChange);
      browser.tabs.onUpdated.removeListener(onBrowserTabUpdated);
    };
  }, [refreshActiveTabInfo, checkGenerationReadiness]);

  return (
    <div ref={topRef} className="space-y-4">
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
        <button
          type="button"
          disabled={isRefreshingActiveTab || isFetchingVacancy}
          onClick={() => void handleRefreshActiveTab()}
          className="mt-2 w-full rounded-xl border border-border py-2 text-[12px] text-muted-foreground disabled:opacity-60"
        >
          {isRefreshingActiveTab ? "Обновление…" : "Обновить активную вкладку"}
        </button>
      </div>

      {vacancyError && <p className="text-[11px] text-red-600">{vacancyError}</p>}

      {vacancy && <VacancyCard vacancy={vacancy} />}

      <div className="space-y-2.5">
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
        <Segmented<FantasyLevel>
          label="Уровень фантазии"
          value={settings.fantasy}
          onChange={(fantasy) => updateSettings({ fantasy })}
          options={[
            ["low", "Низкий"],
            ["medium", "Средний"],
            ["high", "Высокий"],
          ]}
        />
        <div>
          <div className="mb-1 text-[11px] text-muted-foreground">Пример</div>
          {pickerExamples.length === 0 ? (
            <button
              type="button"
              onClick={() => void setActiveTab("examples")}
              className="w-full rounded-xl border border-dashed border-border py-2 text-[12px] text-muted-foreground"
            >
              Добавьте примеры на вкладке «Примеры»
            </button>
          ) : (
            <ul className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-border bg-background p-2">
              {pickerExamples.map((example) => {
                const checked = settings.exampleIds.includes(example.id);

                return (
                  <li key={example.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 hover:bg-surface/80">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExampleSelection(example.id)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1 text-[12px] leading-snug">
                        <span className={example.favorite ? "text-amber-500" : "text-muted-foreground"}>
                          {example.favorite ? "★ " : ""}
                        </span>
                        {example.title}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div>
          <div className="mb-1 text-[11px] text-muted-foreground">Пользовательский промпт</div>
          <textarea
            value={settings.focus}
            onChange={(event) => updateSettings({ focus: event.target.value })}
            placeholder="Любые дополнительные пожелания к письму…"
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-[12px] leading-snug outline-none placeholder:text-muted-foreground focus:border-foreground"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Письмо: кратко ~50 слов · средне ~100 · подробно ~180.
          {settings.includeTheses ? " Тезисы: 4–8 пунктов." : ""}
        </p>
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[12px] hover:bg-surface/80">
            <input
              type="checkbox"
              checked={settings.includeTheses}
              onChange={(event) => updateSettings({ includeTheses: event.target.checked })}
            />
            <span>Тезисы</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[12px] hover:bg-surface/80">
            <input
              type="checkbox"
              checked={settings.includeHiddenKeys}
              onChange={(event) => updateSettings({ includeHiddenKeys: event.target.checked })}
            />
            <span>Скрытые ключи вакансии</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[12px] hover:bg-surface/80">
            <input
              type="checkbox"
              checked={settings.includeTechnologies}
              onChange={(event) => updateSettings({ includeTechnologies: event.target.checked })}
            />
            <span>Технологии</span>
          </label>
        </div>
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
          <ResultView result={generationResult} onScrollToTop={scrollToTop} />
        </>
      )}
    </div>
  );
}
