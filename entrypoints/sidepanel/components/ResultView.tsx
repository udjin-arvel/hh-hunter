import {
  countThesesLines,
  countWords,
  formatThesesForDisplay,
  getDisplayLetter,
} from "@/lib/generation";
import { useAppStore } from "@/lib/store";
import type { GenerationResult } from "@/lib/types";

interface ResultViewProps {
  result: GenerationResult;
}

export function ResultView({ result }: ResultViewProps) {
  const includeTheses = useAppStore((state) => state.settings.includeTheses);
  const includeHiddenKeys = useAppStore((state) => state.settings.includeHiddenKeys);
  const letterDraft = useAppStore((state) => state.letterDraft);
  const thesesDraft = useAppStore((state) => state.thesesDraft);
  const isGenerating = useAppStore((state) => state.isGenerating);
  const copyFeedback = useAppStore((state) => state.copyFeedback);
  const copyThesesFeedback = useAppStore((state) => state.copyThesesFeedback);
  const updateLetterDraft = useAppStore((state) => state.updateLetterDraft);
  const updateThesesDraft = useAppStore((state) => state.updateThesesDraft);
  const copyLetterToClipboard = useAppStore((state) => state.copyLetterToClipboard);
  const copyThesesToClipboard = useAppStore((state) => state.copyThesesToClipboard);
  const regenerateLetter = useAppStore((state) => state.regenerateLetter);
  const openVacancyReply = useAppStore((state) => state.openVacancyReply);

  const displayLetter = getDisplayLetter(letterDraft, result.letter);
  const displayTheses = thesesDraft ?? formatThesesForDisplay(result.theses);
  const letterCounter = `${countWords(displayLetter)} слов`;
  const thesesCounter = `${countThesesLines(displayTheses)} пунктов`;

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
          <span>Готовое письмо</span>
          <span>{letterCounter}</span>
        </div>
        <textarea
          value={displayLetter}
          onChange={(event) => updateLetterDraft(event.target.value)}
          rows={8}
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-[12px] leading-relaxed text-foreground/90 outline-none focus:border-foreground"
        />
        <button
          type="button"
          onClick={() => void copyLetterToClipboard()}
          className="mt-2 w-full rounded-xl border border-border py-2 text-[12px]"
        >
          {copyFeedback === "success"
            ? "Письмо скопировано"
            : copyFeedback === "error"
              ? "Ошибка копирования"
              : "Скопировать письмо"}
        </button>
      </div>

      {includeTheses && result.theses.length > 0 && (
        <div className="rounded-2xl border border-border p-3">
          <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Тезисы</span>
            <span>{thesesCounter}</span>
          </div>
          <textarea
            value={displayTheses}
            onChange={(event) => updateThesesDraft(event.target.value)}
            rows={6}
            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-[12px] leading-relaxed text-foreground/90 outline-none focus:border-foreground"
          />
          <button
            type="button"
            onClick={() => void copyThesesToClipboard()}
            className="mt-2 w-full rounded-xl border border-border py-2 text-[12px]"
          >
            {copyThesesFeedback === "success"
              ? "Тезисы скопированы"
              : copyThesesFeedback === "error"
                ? "Ошибка копирования"
                : "Скопировать тезисы"}
          </button>
        </div>
      )}

      {includeHiddenKeys && result.hidden_keys.length > 0 && (
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
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => void regenerateLetter()}
          className="flex-1 rounded-xl border border-border py-2 text-[12px] disabled:opacity-60"
        >
          Сгенерировать заново ↻
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
