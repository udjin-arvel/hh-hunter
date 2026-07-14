import { useAppStore } from "@/lib/store";

import { Field } from "./Field";
import { PrivacyNotice } from "./PrivacyNotice";
import { ProfilePreview } from "./ProfilePreview";

export function ProfileTab() {
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const clearProfile = useAppStore((state) => state.clearProfile);
  const importPortfolio = useAppStore((state) => state.importPortfolio);
  const isSaving = useAppStore((state) => state.isSaving);
  const isImportingPortfolio = useAppStore((state) => state.isImportingPortfolio);
  const profileUrlError = useAppStore((state) => state.profileUrlError);
  const portfolioImportError = useAppStore((state) => state.portfolioImportError);
  const portfolioImportSuccess = useAppStore((state) => state.portfolioImportSuccess);
  const profilePreview = useAppStore((state) => state.profilePreview);

  const canImport = profile.portfolioLink.trim().length > 0 && !profileUrlError;

  return (
    <div className="space-y-3">
      <Field
        label="Имя"
        placeholder="Александр Иванов"
        value={profile.name}
        onChange={(name) => updateProfile({ name })}
      />

      <div>
        <Field
          label="Ссылка на портфолио / LinkedIn / GitHub"
          placeholder="https://…"
          value={profile.portfolioLink}
          onChange={(portfolioLink) => updateProfile({ portfolioLink })}
        />
        {profileUrlError && <p className="mt-1 text-[11px] text-red-600">{profileUrlError}</p>}
        <button
          type="button"
          disabled={!canImport || isImportingPortfolio}
          onClick={() => void importPortfolio()}
          className="mt-2 w-full rounded-xl border border-border py-2 text-[12px] text-foreground disabled:opacity-60"
        >
          {isImportingPortfolio ? "Импорт…" : "Импортировать"}
        </button>
        {portfolioImportError && (
          <p className="mt-1 text-[11px] text-red-600">{portfolioImportError}</p>
        )}
        {portfolioImportSuccess && !portfolioImportError && (
          <p className="mt-1 text-[11px] text-success">Текст загружен</p>
        )}
      </div>

      <div>
        <div className="mb-1 text-[11px] text-muted-foreground">Достижения и навыки</div>
        <textarea
          rows={6}
          value={profile.achievements}
          onChange={(event) => updateProfile({ achievements: event.target.value })}
          placeholder="Опишите ключевые проекты, цифры, инструменты… Или используйте импорт по ссылке выше."
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-foreground"
        />
      </div>

      <PrivacyNotice variant="short" />

      {profilePreview && <ProfilePreview text={profilePreview} />}

      <button
        type="button"
        disabled={isSaving || Boolean(profileUrlError)}
        onClick={() => void saveProfile()}
        className="w-full rounded-xl bg-primary py-2.5 text-[13px] text-primary-foreground disabled:opacity-60"
      >
        {isSaving ? "Сохранение…" : "Сохранить профиль"}
      </button>

      <button
        type="button"
        disabled={isSaving}
        onClick={() => void clearProfile()}
        className="w-full rounded-xl border border-border bg-background py-2.5 text-[13px] text-foreground disabled:opacity-60"
      >
        Очистить профиль
      </button>
    </div>
  );
}
