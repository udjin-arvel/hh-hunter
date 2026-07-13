interface PrivacyNoticeProps {
  variant?: "short" | "full";
}

export function PrivacyNotice({ variant = "short" }: PrivacyNoticeProps) {
  if (variant === "short") {
    return (
      <div className="rounded-xl bg-surface p-3 text-[11px] leading-relaxed text-muted-foreground">
        Профиль и настройки хранятся локально в браузере. При генерации в DeepSeek отправляются имя,
        опыт, данные вакансии и параметры письма. Запросы к HH API — только по ID вакансии.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
      <p className="font-medium text-foreground">Конфиденциальность</p>
      <ul className="space-y-1.5">
        <li>
          <span className="text-foreground">Локально:</span> профиль и настройки генерации в{" "}
          <span className="font-mono">chrome.storage.local</span>.
        </li>
        <li>
          <span className="text-foreground">DeepSeek:</span> при нажатии «Сгенерировать» — имя,
          опыт/портфолио, описание вакансии, навыки и настройки стиля/длины.
        </li>
        <li>
          <span className="text-foreground">HH API:</span> публичный запрос{" "}
          <span className="font-mono">GET /vacancies/&#123;id&#125;</span> без авторизации.
        </li>
        <li>
          <span className="text-foreground">Портфолио:</span> опциональный запрос к URL, указанному
          пользователем; при блокировке — ручной ввод достижений.
        </li>
      </ul>
      <p>Данные не отправляются на другие серверы. Подробнее — в PRIVACY.md в репозитории.</p>
    </div>
  );
}
