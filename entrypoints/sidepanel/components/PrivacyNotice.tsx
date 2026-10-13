interface PrivacyNoticeProps {
  variant?: "short" | "full";
}

export function PrivacyNotice({ variant = "short" }: PrivacyNoticeProps) {
  if (variant === "short") {
    return (
      <div className="rounded-xl bg-surface p-3 text-[11px] leading-relaxed text-muted-foreground">
        Профиль, примеры и настройки хранятся локально в браузере. В LLM уходит текст резюме
        только по кнопке «Обработать и сохранить»; правки после этого — по кнопке «Сохранить», без LLM.
        При генерации письма — сохранённое резюме, данные вакансии, примеры и параметры.
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
          <span className="text-foreground">LLM:</span> при нажатии «Сгенерировать» — имя,
          текст резюме, описание вакансии, навыки, выбранные примеры писем и настройки длины и
          уровня фантазии.
        </li>
        <li>
          <span className="text-foreground">HH API:</span> публичный запрос{" "}
          <span className="font-mono">GET /vacancies/&#123;id&#125;</span> без авторизации.
        </li>
        <li>
          <span className="text-foreground">Резюме:</span> вставленный текст отправляется в LLM
          только по кнопке «Обработать и сохранить»; дальнейшие правки — по «Сохранить», только локально.
        </li>
      </ul>
      <p>Данные не отправляются на другие серверы. Подробнее — в PRIVACY.md в репозитории.</p>
    </div>
  );
}
