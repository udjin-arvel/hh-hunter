import { useEffect, useState } from "react";

import type { GenerationStage } from "@/lib/types";

interface GenerationProgressProps {
  stage: GenerationStage;
  startedAt: number | null;
  onCancel: () => void;
}

const STAGES: Array<{ id: GenerationStage; label: string }> = [
  { id: "analyzing", label: "Анализ требований…" },
  { id: "intersection", label: "Поиск точек пересечения…" },
  { id: "writing", label: "Генерация текста…" },
];

function stageIndex(stage: GenerationStage): number {
  if (stage === "idle") {
    return -1;
  }

  return STAGES.findIndex((item) => item.id === stage);
}

function Step({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          done ? "bg-success" : active ? "animate-pulse bg-foreground" : "bg-border"
        }`}
      />
      <span className={done ? "text-muted-foreground line-through" : ""}>{label}</span>
    </div>
  );
}

export function GenerationProgress({ stage, startedAt, onCancel }: GenerationProgressProps) {
  const currentIndex = stageIndex(stage);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [startedAt]);

  const elapsedSeconds = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-surface/60 p-3">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Прошло {elapsedSeconds} с</span>
        <button
          type="button"
          onClick={onCancel}
          className="text-foreground underline-offset-2 hover:underline"
        >
          Отменить
        </button>
      </div>
      <div className="space-y-1.5">
        {STAGES.map((item, index) => (
          <Step
            key={item.id}
            label={item.label}
            done={currentIndex > index}
            active={currentIndex === index}
          />
        ))}
      </div>
    </div>
  );
}
