import type { TabKey } from "@/lib/types";

const TABS: [TabKey, string][] = [
  ["profile", "Профиль"],
  ["generator", "Генератор"],
  ["examples", "Примеры"],
];

interface TabBarProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <div className="mx-5 mb-4 flex rounded-full bg-surface p-1 text-[11px]">
      {TABS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex-1 rounded-full px-2 py-1.5 transition ${
            activeTab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
