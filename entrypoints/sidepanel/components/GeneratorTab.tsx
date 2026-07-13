import { useAppStore } from "@/lib/store";
import type { LetterLength, LetterStyle } from "@/lib/types";

import { Segmented } from "./Segmented";

function ResultBlockPlaceholder() {
  return (
    <div className="space-y-3 pt-1">
      <div className="rounded-2xl border border-accent/40 bg-accent/10 p-3">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-accent-foreground/80">
          Точка пересечения
        </div>
        <p className="text-[12px] leading-relaxed">
          В вакансии — управление изменениями в дизайн-системе. У вас — миграция B2B-продукта на
          новую DS. Идеальный мостик.
        </p>
      </div>

      <div className="rounded-2xl border border-border p-3">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Готовое письмо</span>
          <span>132 слова</span>
        </div>
        <p className="text-[12px] leading-relaxed text-foreground/90">
          Здравствуйте! Прочитал описание вакансии продуктового дизайнера и увидел знакомую задачу —
          развивать зрелую дизайн-систему в условиях быстрых продуктовых итераций.
        </p>
      </div>

      <details className="rounded-2xl border border-border p-3 text-[12px]">
        <summary className="cursor-pointer text-[11px] text-muted-foreground">
          Скрытые ключи вакансии (3)
        </summary>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>· Устойчивость к смене приоритетов</li>
          <li>· Опыт защиты решений перед стейкхолдерами</li>
          <li>· Кросс-командная коммуникация</li>
        </ul>
      </details>

      <div className="flex gap-2">
        <button
          type="button"
          disabled
          className="flex-1 rounded-xl bg-primary py-2 text-[12px] text-primary-foreground opacity-60"
        >
          Скопировать
        </button>
        <button
          type="button"
          disabled
          className="rounded-xl border border-border px-3 py-2 text-[12px] opacity-60"
        >
          ↻
        </button>
        <button
          type="button"
          disabled
          className="rounded-xl border border-border px-3 py-2 text-[12px] opacity-60"
        >
          Отклик ↗
        </button>
      </div>
    </div>
  );
}

export function GeneratorTab() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface/60 p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Активная вкладка</span>
          <span className="inline-flex items-center gap-1 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            hh.ru/vacancy
          </span>
        </div>
        <div className="truncate rounded-lg bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground">
          hh.ru/vacancy/128456712
        </div>
        <button
          type="button"
          disabled
          className="mt-2 w-full rounded-xl bg-primary py-2.5 text-[13px] font-medium text-primary-foreground opacity-60"
        >
          Сканировать вакансию
        </button>
      </div>

      <div className="rounded-2xl border border-border p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[13px] font-semibold">Продуктовый дизайнер</div>
            <div className="text-[11px] text-muted-foreground">
              Тинькофф · крупный бизнес · Гибрид
            </div>
          </div>
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
            3–6 лет
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Figma", "UX-research", "B2C", "Design system"].map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <Segmented<LetterStyle>
          label="Стиль"
          value={settings.style}
          onChange={(style) => updateSettings({ style })}
          options={[
            ["business", "Деловой"],
            ["emotional", "Эмоц."],
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
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-foreground"
          />
        </div>
      </div>

      <button
        type="button"
        disabled
        className="w-full rounded-xl bg-primary py-3 text-[13px] font-medium text-primary-foreground opacity-60"
      >
        Сгенерировать письмо ↗
      </button>

      <ResultBlockPlaceholder />
    </div>
  );
}
