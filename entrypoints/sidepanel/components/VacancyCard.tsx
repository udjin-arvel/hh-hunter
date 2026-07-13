import type { Vacancy } from "@/lib/types";

interface VacancyCardProps {
  vacancy: Vacancy;
}

function buildSubtitle(vacancy: Vacancy): string {
  return [vacancy.company_name, vacancy.company_type, vacancy.employment]
    .filter(Boolean)
    .join(" · ");
}

export function VacancyCard({ vacancy }: VacancyCardProps) {
  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold">{vacancy.title}</div>
          <div className="text-[11px] text-muted-foreground">{buildSubtitle(vacancy)}</div>
        </div>
        {vacancy.experience_required && (
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
            {vacancy.experience_required}
          </span>
        )}
      </div>
      {vacancy.key_skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {vacancy.key_skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
