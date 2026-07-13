import type { HhVacancyResponse } from "./api/hh";

const ZWSP = /[\u200B-\u200F\uFEFF\u2060\u202A-\u202E]/g;

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL: "Полная занятость",
  PART: "Частичная занятость",
  PROJECT: "Проектная работа",
  VOLUNTEER: "Волонтерство",
  PROBATION: "Стажировка",
};

const WORK_FORMAT_LABELS: Record<string, string> = {
  REMOTE: "Удалённо",
  HYBRID: "Гибрид",
  ON_SITE: "На месте работодателя",
  FIELD_WORK: "Разъездной",
};

const WORK_SCHEDULE_LABELS: Record<string, string> = {
  FIVE_ON_TWO_OFF: "5/2",
  TWO_ON_TWO_OFF: "2/2",
  THREE_ON_THREE_OFF: "3/3",
  WEEKEND: "По выходным",
  FLEXIBLE: "Свободный график",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  noExperience: "Без опыта",
  between1And3: "1–3 года",
  between3And6: "3–6 лет",
  moreThan6: "Более 6 лет",
};

function normalizeText(value: string): string {
  return value.replace(ZWSP, "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }

  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function readTextFromDocument(doc: Document, selectors: string[]): string {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    const text = element?.textContent;

    if (text) {
      const normalized = normalizeText(text);

      if (normalized) {
        return normalized;
      }
    }
  }

  return "";
}

function readHtmlFromDocument(doc: Document, selectors: string[]): string {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    const html = element?.innerHTML?.trim();

    if (html) {
      return html;
    }
  }

  return "";
}

function readSkillsFromDocument(doc: Document): string[] {
  const skills = new Set<string>();

  for (const element of doc.querySelectorAll(
    '[data-qa="bloko-tag__text"], [data-qa="skills-element"], [data-qa="vacancy-skill"]',
  )) {
    const skill = normalizeText(element.textContent ?? "");

    if (skill) {
      skills.add(skill);
    }
  }

  return [...skills].slice(0, 30);
}

function readJobPostingFromDocument(doc: Document, vacancyId: string): HhVacancyResponse | null {
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(script.textContent ?? "") as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        if (
          typeof item === "object" &&
          item !== null &&
          "@type" in item &&
          item["@type"] === "JobPosting"
        ) {
          const record = item as Record<string, unknown>;
          const title = typeof record.title === "string" ? normalizeText(record.title) : "";
          const description = typeof record.description === "string" ? record.description : "";
          const hiringOrganization =
            typeof record.hiringOrganization === "object" && record.hiringOrganization !== null
              ? (record.hiringOrganization as Record<string, unknown>)
              : null;
          const companyName =
            typeof hiringOrganization?.name === "string"
              ? normalizeText(hiringOrganization.name)
              : "";

          if (title) {
            return {
              id: vacancyId,
              name: title,
              description,
              employer: companyName ? { name: companyName } : null,
              key_skills: [],
            };
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  }

  return null;
}

function findVacancyNode(node: unknown, depth = 0): Record<string, unknown> | null {
  if (!node || typeof node !== "object" || depth > 12) {
    return null;
  }

  const record = node as Record<string, unknown>;

  if ("vacancyId" in record && typeof record.name === "string") {
    return record;
  }

  for (const value of Object.values(record)) {
    if (typeof value === "object") {
      const found = findVacancyNode(value, depth + 1);

      if (found) {
        return found;
      }
    }
  }

  return null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (typeof item === "object" && item !== null && "name" in item) {
        const name = (item as Record<string, unknown>).name;
        return typeof name === "string" ? name : "";
      }

      return "";
    })
    .filter(Boolean);
}

function mapEmploymentLabel(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return EMPLOYMENT_LABELS[value] ?? value;
}

function mapScheduleLabel(record: Record<string, unknown>): string {
  const workFormats = readStringArray(record.workFormats)
    .map((value) => WORK_FORMAT_LABELS[value] ?? value)
    .filter(Boolean);
  const workScheduleByDays = readStringArray(record.workScheduleByDays)
    .map((value) => WORK_SCHEDULE_LABELS[value] ?? value)
    .filter(Boolean);

  return [...workFormats, ...workScheduleByDays].join(", ");
}

function readVacancyFromLuxState(doc: Document, vacancyId: string): HhVacancyResponse | null {
  const template = doc.querySelector("#HH-Lux-InitialState");

  if (!template) {
    return null;
  }

  const raw = template.textContent?.trim();

  if (!raw) {
    return null;
  }

  try {
    const state = JSON.parse(raw.replace(/&#34;/g, '"')) as unknown;
    const vacancy = findVacancyNode(state);

    if (!vacancy) {
      return null;
    }

    const stateVacancyId = String(vacancy.vacancyId ?? vacancyId);

    if (stateVacancyId !== vacancyId) {
      return null;
    }

    const title = typeof vacancy.name === "string" ? normalizeText(vacancy.name) : "";
    const company =
      typeof vacancy.company === "object" && vacancy.company !== null
        ? (vacancy.company as Record<string, unknown>)
        : null;
    const companyName =
      typeof company?.visibleName === "string"
        ? normalizeText(company.visibleName)
        : typeof company?.name === "string"
          ? normalizeText(company.name)
          : "";
    const description =
      typeof vacancy.description === "string" ? decodeHtmlEntities(vacancy.description) : "";
    const experienceCode = typeof vacancy.workExperience === "string" ? vacancy.workExperience : "";
    const employment = mapEmploymentLabel(vacancy.employmentForm);
    const schedule = mapScheduleLabel(vacancy);
    const keySkills = readStringArray(vacancy.keySkills).map((name) => ({ name }));

    if (!title) {
      return null;
    }

    return {
      id: vacancyId,
      name: title,
      description,
      employer: companyName ? { name: companyName } : null,
      key_skills: keySkills,
      experience: experienceCode
        ? { id: experienceCode, name: EXPERIENCE_LABELS[experienceCode] ?? experienceCode }
        : null,
      employment: employment ? { id: "unknown", name: employment } : null,
      schedule: schedule ? { id: "unknown", name: schedule } : null,
    };
  } catch {
    return null;
  }
}

export function parseVacancyDocument(doc: Document, vacancyId: string): HhVacancyResponse | null {
  const fromJsonLd = readJobPostingFromDocument(doc, vacancyId);

  if (fromJsonLd) {
    return fromJsonLd;
  }

  const fromLuxState = readVacancyFromLuxState(doc, vacancyId);

  if (fromLuxState) {
    return fromLuxState;
  }

  const title = readTextFromDocument(doc, ['[data-qa="vacancy-title"]', "h1"]);
  const company = readTextFromDocument(doc, [
    '[data-qa="vacancy-company-name"]',
    '[data-qa="vacancy-view-employee-name"]',
    'a[data-qa="vacancy-company-name"]',
  ]);
  const description = readHtmlFromDocument(doc, [
    '[data-qa="vacancy-description"]',
    ".vacancy-description",
    '[class*="vacancy-description"]',
  ]);
  const experience = readTextFromDocument(doc, ['[data-qa="vacancy-experience"]']);
  const employment = readTextFromDocument(doc, [
    '[data-qa="vacancy-view-employment-mode"]',
    '[data-qa="vacancy-view-employment-mode-text"]',
  ]);
  const schedule = readTextFromDocument(doc, [
    '[data-qa="vacancy-view-work-schedule-schedule"]',
    '[data-qa="vacancy-view-schedule"]',
  ]);
  const skills = readSkillsFromDocument(doc);

  if (!title) {
    return null;
  }

  return {
    id: vacancyId,
    name: title,
    description,
    employer: company ? { name: company } : null,
    key_skills: skills.map((name) => ({ name })),
    experience: experience ? { id: "unknown", name: experience } : null,
    employment: employment ? { id: "unknown", name: employment } : null,
    schedule: schedule ? { id: "unknown", name: schedule } : null,
  };
}

export function parseVacancyFromHtml(html: string, vacancyId: string): HhVacancyResponse | null {
  if (typeof DOMParser === "undefined") {
    return null;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  return parseVacancyDocument(doc, vacancyId);
}
