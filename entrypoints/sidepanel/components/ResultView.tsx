import { countThesesLines, countWords, getDisplayLetter } from "@/lib/generation";
import { useAppStore } from "@/lib/store";
import type { GenerationResult } from "@/lib/types";

interface ResultViewProps {
  result: GenerationResult;
}

export function ResultView({ result }: ResultViewProps) {
  const letterDraft = useAppStore((state) => state.letterDraft);
  const isGenerating = useAppStore((state) => state.isGenerating);
  const copyFeedback = useAppStore((state) => state.copyFeedback);
  const settings = useAppStore((state) => state.settings);
  const updateLetterDraft = useAppStore((state) => state.updateLetterDraft);
  const copyLetterToClipboard = useAppStore((state) => state.copyLetterToClipboard);
  const regenerateLetter = useAppStore((state) => state.regenerateLetter);
  const openVacancyReply = useAppStore((state) => state.openVacancyReply);

  const displayLetter = getDisplayLetter(letterDraft, result.letter);
  const isTheses = settings.format === "theses";
  const counterLabel = isTheses
    ? `${countThesesLines(displayLetter)} пунктов`
    : `${countWords(displayLetter)} слов`;

  return (
    <div className="space-y-3 pt-1">
      <div className="rounded-2xl border border-accent/40 bg-accent/10 p-3">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-accent-foreground/80">
          Точка пересечения
        </div>
        <p className="text-[12px] leading-relaxed">{result.unique_intersection}</p>
      </div>

      <div className="rounded-2xl border border-border p-3">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{isTheses ? "Тезисы" : "Готовое письмо"}</span>
          <span>{counterLabel}</span>
        </div>
        <textarea
          value={displayLetter}
          onChange={(event) => updateLetterDraft(event.target.value)}
          rows={8}
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-[12px] leading-relaxed text-foreground/90 outline-none focus:border-foreground"
        />
      </div>

      <details className="rounded-2xl border border-border p-3 text-[12px]">
        <summary className="cursor-pointer text-[11px] text-muted-foreground">
          Скрытые ключи вакансии ({result.hidden_keys.length})
        </summary>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {result.hidden_keys.map((key) => (
            <li key={key}>· {key}</li>
          ))}
        </ul>
      </details>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void copyLetterToClipboard()}
          className="flex-1 rounded-xl bg-primary py-2 text-[12px] text-primary-foreground"
        >
          {copyFeedback === "success"
            ? "Скопировано"
            : copyFeedback === "error"
              ? "Ошибка копирования"
              : "Скопировать"}
        </button>
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => void regenerateLetter()}
          className="rounded-xl border border-border px-3 py-2 text-[12px] disabled:opacity-60"
          aria-label="Сгенерировать заново"
        >
          ↻
        </button>
        <button
          type="button"
          onClick={() => openVacancyReply()}
          className="rounded-xl border border-border px-3 py-2 text-[12px]"
        >
          Отклик ↗
        </button>
      </div>
    </div>
  );
}
