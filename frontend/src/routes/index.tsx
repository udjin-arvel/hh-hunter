import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HH-Hunter — макет расширения" },
      { name: "description", content: "Визуальный макет Chrome-расширения HH-Hunter в стиле Grok" },
    ],
  }),
  component: Mockup,
});

type TabKey = "profile" | "generator" | "api";

function Mockup() {
  const [tab, setTab] = useState<TabKey>("generator");
  const [style, setStyle] = useState("business");
  const [length, setLength] = useState("medium");
  const [generated, setGenerated] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-tight">HH-Hunter</span>
            <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              v1.0 · Mockup
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-border px-4 py-1.5 text-[13px] hover:bg-surface">
              Документация
            </button>
            <button className="rounded-full bg-primary px-4 py-1.5 text-[13px] text-primary-foreground hover:opacity-90">
              Установить
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14">
        {/* Hero */}
        <section className="mb-14 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[12px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Работает на DeepSeek · HH.ru API
          </div>
          <h1 className="mx-auto max-w-3xl text-[44px] font-semibold leading-[1.05] tracking-tight md:text-[56px]">
            Сопроводительные письма, <br />
            которые <span className="italic text-muted-foreground">действительно</span> читают.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Расширение для Chrome: сканирует вакансию на HH и за 2 клика собирает
            письмо под тон компании, скрытые требования и ваш реальный опыт.
          </p>
        </section>

        {/* Mockup stage */}
        <section className="grid gap-10 lg:grid-cols-[420px_1fr] lg:items-start">
          {/* Popup mockup */}
          <div className="mx-auto w-full max-w-[420px]">
            <div className="rounded-[28px] border border-border bg-surface p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                </div>
                <span className="text-[11px] text-muted-foreground">chrome-extension://hh-hunter</span>
                <span className="w-8" />
              </div>

              <div className="overflow-hidden rounded-[20px] bg-background">
                {/* App header inside popup */}
                <div className="flex items-center justify-between px-5 pb-3 pt-5">
                  <div className="flex items-center gap-2">
                    <LogoMark small />
                    <span className="text-[14px] font-semibold">HH-Hunter</span>
                  </div>
                  <button className="rounded-full p-1.5 text-muted-foreground hover:bg-surface">
                    <SettingsIcon />
                  </button>
                </div>

                {/* Tabs */}
                <div className="mx-5 mb-4 flex rounded-full bg-surface p-1 text-[12px]">
                  {(
                    [
                      ["profile", "Профиль"],
                      ["generator", "Генератор"],
                      ["api", "API"],
                    ] as [TabKey, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`flex-1 rounded-full px-3 py-1.5 transition ${
                        tab === key
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="px-5 pb-5">
                  {tab === "generator" && <GeneratorView
                    style={style} setStyle={setStyle}
                    length={length} setLength={setLength}
                    generated={generated} setGenerated={setGenerated}
                  />}
                  {tab === "profile" && <ProfileView />}
                  {tab === "api" && <ApiView />}
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-[12px] text-muted-foreground">
              Попап 400 × 620 · Manifest V3
            </p>
          </div>

          {/* Side notes */}
          <div className="space-y-4">
            <Note num="01" title="Сканирование вакансии">
              Кнопка подсвечивается зелёным, когда открыта страница <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px]">hh.ru/vacancy/…</code>.
              ID вытаскивается из URL, данные тянутся напрямую с <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px]">api.hh.ru</code>.
            </Note>
            <Note num="02" title="Скрытые ключи">
              DeepSeek возвращает JSON с тремя блоками: <em>hidden_keys</em>,
              <em> unique_intersection</em>, <em>letter</em>. Первые два — стратегия
              письма, третий — готовый текст.
            </Note>
            <Note num="03" title="Без галлюцинаций">
              Если навыка нет — акцент на смежных компетенциях и обучаемости.
              Никаких выдуманных проектов.
            </Note>
            <Note num="04" title="Приватность">
              Ключ DeepSeek и данные профиля хранятся в <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px]">chrome.storage.local</code>.
              Никаких третьих серверов между вами и моделью.
            </Note>
          </div>
        </section>

        {/* States row */}
        <section className="mt-20">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Ключевые состояния</h2>
            <span className="text-[13px] text-muted-foreground">4 экрана</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StateCard title="Пусто" subtitle="Первый запуск">
              <EmptyMini />
            </StateCard>
            <StateCard title="Сканирование" subtitle="Вакансия найдена">
              <ScanMini />
            </StateCard>
            <StateCard title="Генерация" subtitle="Прогресс шагов">
              <LoadingMini />
            </StateCard>
            <StateCard title="Результат" subtitle="3 блока + действия">
              <ResultMini />
            </StateCard>
          </div>
        </section>

        {/* Palette */}
        <section className="mt-20 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-6">
            <h3 className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Палитра
            </h3>
            <div className="mt-5 grid grid-cols-6 gap-2">
              {[
                ["#FDFDFC", "bg"],
                ["#F4F4F3", "surface"],
                ["#E8E8E7", "border"],
                ["#7A7A79", "muted"],
                ["#1B1B1A", "ink"],
                ["#E38A2F", "accent"],
              ].map(([hex, name]) => (
                <div key={name} className="text-center">
                  <div
                    className="h-14 w-full rounded-lg border border-border"
                    style={{ background: hex }}
                  />
                  <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">{name}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border p-6">
            <h3 className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Типографика
            </h3>
            <div className="mt-5 space-y-3">
              <div className="text-[32px] font-semibold tracking-tight">Aa — Inter Semibold</div>
              <div className="text-[15px] text-muted-foreground">
                Основной шрифт для интерфейса и заголовков. Округлые радиусы, спокойные веса.
              </div>
              <div className="font-mono text-[13px] text-muted-foreground">
                mono · JetBrains Mono · 12–13px для кода и лейблов
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-20 flex items-center justify-between border-t border-border pt-6 text-[12px] text-muted-foreground">
          <span>HH-Hunter · концепт-макет</span>
          <span>Визуальный язык вдохновлён Grok</span>
        </footer>
      </main>
    </div>
  );
}

/* -------------------- Views -------------------- */

function GeneratorView({
  style, setStyle, length, setLength, generated, setGenerated,
}: {
  style: string; setStyle: (s: string) => void;
  length: string; setLength: (s: string) => void;
  generated: boolean; setGenerated: (b: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Scan card */}
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
        <button className="mt-2 w-full rounded-xl bg-primary py-2.5 text-[13px] font-medium text-primary-foreground">
          Сканировать вакансию
        </button>
      </div>

      {/* Vacancy summary */}
      <div className="rounded-2xl border border-border p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[13px] font-semibold">Продуктовый дизайнер</div>
            <div className="text-[11px] text-muted-foreground">Тинькофф · крупный бизнес · Гибрид</div>
          </div>
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">3–6 лет</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Figma", "UX-research", "B2C", "Design system"].map((s) => (
            <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-2.5">
        <Segmented
          label="Стиль"
          value={style}
          onChange={setStyle}
          options={[
            ["business", "Деловой"],
            ["emotional", "Эмоц."],
            ["numbers", "Цифры"],
          ]}
        />
        <Segmented
          label="Длина"
          value={length}
          onChange={setLength}
          options={[
            ["short", "Кратко"],
            ["medium", "Средне"],
            ["long", "Подробно"],
          ]}
        />
        <div>
          <div className="mb-1 text-[11px] text-muted-foreground">Дополнительный фокус</div>
          <input
            placeholder="Напр. акцент на управлении командами…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-foreground"
          />
        </div>
      </div>

      <button
        onClick={() => setGenerated(!generated)}
        className="w-full rounded-xl bg-primary py-3 text-[13px] font-medium text-primary-foreground"
      >
        Сгенерировать письмо ↗
      </button>

      {generated && <ResultBlock />}
    </div>
  );
}

function ResultBlock() {
  return (
    <div className="space-y-3 pt-1">
      {/* Unique intersection */}
      <div className="rounded-2xl border border-accent/40 bg-accent/10 p-3">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-accent-foreground/80">
          Точка пересечения
        </div>
        <p className="text-[12px] leading-relaxed">
          В вакансии — управление изменениями в дизайн-системе. У вас — миграция
          B2B-продукта на новую DS. Идеальный мостик.
        </p>
      </div>

      {/* Letter */}
      <div className="rounded-2xl border border-border p-3">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Готовое письмо</span>
          <span>132 слова</span>
        </div>
        <p className="text-[12px] leading-relaxed text-foreground/90">
          Здравствуйте! Прочитал описание вакансии продуктового дизайнера и увидел
          знакомую задачу — развивать зрелую дизайн-систему в условиях быстрых
          продуктовых итераций. В прошлом проекте я вёл миграцию B2B-модуля на
          новую DS: договаривался с фронтом о токенах, собирал ревью-петлю с
          продактами и сокращал цикл выпуска экрана с 5 до 2 дней…
        </p>
      </div>

      {/* Hidden keys */}
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

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 rounded-xl bg-primary py-2 text-[12px] text-primary-foreground">
          Скопировать
        </button>
        <button className="rounded-xl border border-border px-3 py-2 text-[12px]">↻</button>
        <button className="rounded-xl border border-border px-3 py-2 text-[12px]">Отклик ↗</button>
      </div>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="space-y-3">
      <Field label="Имя" placeholder="Александр Иванов" />
      <Field label="Ссылка на портфолио / LinkedIn / GitHub" placeholder="https://…" />
      <div>
        <div className="mb-1 text-[11px] text-muted-foreground">Достижения и навыки</div>
        <textarea
          rows={6}
          placeholder="Опишите ключевые проекты, цифры, инструменты…"
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-foreground"
        />
      </div>
      <div className="rounded-xl bg-surface p-3 text-[11px] text-muted-foreground">
        Данные хранятся локально в браузере и уходят только в DeepSeek при генерации.
      </div>
      <button className="w-full rounded-xl bg-primary py-2.5 text-[13px] text-primary-foreground">
        Сохранить профиль
      </button>
    </div>
  );
}

function ApiView() {
  return (
    <div className="space-y-3">
      <Field label="DeepSeek API Key" placeholder="sk-••••••••••••••••" mono />
      <div className="rounded-xl border border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
        Ключ никуда не отправляется, кроме <span className="font-mono text-foreground">api.deepseek.com</span>.
        Модель <span className="font-mono text-foreground">deepseek-chat</span>, температура 0.7.
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-[12px]">
        <span className="text-muted-foreground">Статус</span>
        <span className="inline-flex items-center gap-1.5 text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> подключено
        </span>
      </div>
      <button className="w-full rounded-xl bg-primary py-2.5 text-[13px] text-primary-foreground">
        Проверить ключ
      </button>
    </div>
  );
}

/* -------------------- Bits -------------------- */

function Field({ label, placeholder, mono }: { label: string; placeholder: string; mono?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-muted-foreground">{label}</div>
      <input
        placeholder={placeholder}
        className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-foreground ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function Segmented({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-muted-foreground">{label}</div>
      <div className="flex rounded-xl bg-surface p-1 text-[12px]">
        {options.map(([k, l]) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`flex-1 rounded-lg py-1.5 transition ${
              value === k ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Note({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="mb-2 flex items-center gap-3">
        <span className="font-mono text-[11px] text-muted-foreground">{num}</span>
        <h3 className="text-[15px] font-semibold">{title}</h3>
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function StateCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/50 p-4">
      <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-background">
        {children}
      </div>
      <div className="text-[13px] font-medium">{title}</div>
      <div className="text-[11px] text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function EmptyMini() {
  return (
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <div className="h-10 w-10 rounded-full border border-dashed border-border" />
      <div className="text-[10px]">Заполните профиль</div>
    </div>
  );
}
function ScanMini() {
  return (
    <div className="w-4/5 space-y-2">
      <div className="rounded-lg bg-surface px-2 py-1.5 font-mono text-[9px] text-muted-foreground">hh.ru/vacancy/128…</div>
      <div className="rounded-lg bg-primary py-1.5 text-center text-[10px] text-primary-foreground">Сканировать</div>
      <div className="flex items-center justify-center gap-1 text-[9px] text-success">
        <span className="h-1 w-1 rounded-full bg-success" /> вакансия найдена
      </div>
    </div>
  );
}
function LoadingMini() {
  return (
    <div className="w-4/5 space-y-1.5 text-[10px]">
      <Step done>Анализ требований</Step>
      <Step done>Скрытые ключи</Step>
      <Step>Генерация текста…</Step>
    </div>
  );
}
function Step({ children, done }: { children: React.ReactNode; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-success" : "animate-pulse bg-foreground"}`} />
      <span className={done ? "text-muted-foreground line-through" : ""}>{children}</span>
    </div>
  );
}
function ResultMini() {
  return (
    <div className="w-4/5 space-y-1.5">
      <div className="rounded-md bg-accent/20 px-2 py-1 text-[9px]">Точка пересечения</div>
      <div className="space-y-0.5 rounded-md border border-border px-2 py-1">
        <div className="h-1 w-full rounded bg-surface" />
        <div className="h-1 w-11/12 rounded bg-surface" />
        <div className="h-1 w-3/4 rounded bg-surface" />
      </div>
      <div className="rounded-md bg-primary py-1 text-center text-[9px] text-primary-foreground">Скопировать</div>
    </div>
  );
}

function LogoMark({ small }: { small?: boolean }) {
  const size = small ? 18 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 18 L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 14 L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
