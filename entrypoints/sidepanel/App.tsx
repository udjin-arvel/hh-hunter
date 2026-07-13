import { useEffect } from "react";

import { useAppStore } from "@/lib/store";
import type { TabKey } from "@/lib/types";

import { GeneratorTab } from "./components/GeneratorTab";
import { LogoMark } from "./components/LogoMark";
import { ProfileTab } from "./components/ProfileTab";
import { TabBar } from "./components/TabBar";

function LoadingShell() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background text-muted-foreground">
      <div className="text-[13px]">Загрузка…</div>
    </main>
  );
}

export default function App() {
  const isHydrated = useAppStore((state) => state.isHydrated);
  const activeTab = useAppStore((state) => state.activeTab);
  const saveError = useAppStore((state) => state.saveError);
  const loadFromStorage = useAppStore((state) => state.loadFromStorage);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  useEffect(() => {
    void loadFromStorage();
  }, [loadFromStorage]);

  if (!isHydrated) {
    return <LoadingShell />;
  }

  const handleTabChange = (tab: TabKey) => {
    void setActiveTab(tab);
  };

  return (
    <main className="flex min-h-screen w-full flex-col overflow-hidden bg-background text-foreground font-sans antialiased">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <div className="flex items-center gap-2">
          <LogoMark small />
          <span className="text-[14px] font-semibold">HH-Hunter</span>
        </div>
      </div>

      <TabBar activeTab={activeTab} onChange={handleTabChange} />

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "generator" && <GeneratorTab />}
      </div>

      {saveError && (
        <div className="border-t border-border px-5 py-2 text-[11px] text-red-600">{saveError}</div>
      )}
    </main>
  );
}
