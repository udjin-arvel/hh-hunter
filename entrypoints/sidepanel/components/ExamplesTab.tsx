import { useState } from "react";

import { useAppStore } from "@/lib/store";
import type { LetterExample } from "@/lib/types";

import { Field } from "./Field";

export function ExamplesTab() {
  const examples = useAppStore((state) => state.examples);
  const isSaving = useAppStore((state) => state.isSaving);
  const addExample = useAppStore((state) => state.addExample);
  const updateExample = useAppStore((state) => state.updateExample);
  const deleteExample = useAppStore((state) => state.deleteExample);
  const toggleExampleFavorite = useAppStore((state) => state.toggleExampleFavorite);

  const [title, setTitle] = useState("");
  const [letter, setLetter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLetter, setEditLetter] = useState("");

  const canAdd = title.trim().length > 0 && letter.trim().length > 0 && !isSaving;

  const startEdit = (example: LetterExample) => {
    setEditingId(example.id);
    setEditTitle(example.title);
    setEditLetter(example.letter);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditLetter("");
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editLetter.trim()) {
      return;
    }

    await updateExample(editingId, { title: editTitle, letter: editLetter });
    cancelEdit();
  };

  const sortedExamples = [...examples].sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
    }

    return left.title.localeCompare(right.title, "ru");
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface/60 p-3 space-y-2">
        <div className="text-[12px] font-medium">Новый пример</div>
        <Field
          label="Заголовок"
          placeholder="Напр. Отклик в продуктовую команду"
          value={title}
          onChange={setTitle}
        />
        <div>
          <div className="mb-1 text-[11px] text-muted-foreground">Сопроводительное письмо</div>
          <textarea
            rows={6}
            value={letter}
            onChange={(event) => setLetter(event.target.value)}
            placeholder="Вставьте текст удачного письма…"
            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-foreground"
          />
        </div>
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            void addExample(title, letter).then(() => {
              setTitle("");
              setLetter("");
            });
          }}
          className="w-full rounded-xl bg-primary py-2.5 text-[13px] text-primary-foreground disabled:opacity-60"
        >
          Добавить пример
        </button>
      </div>

      {sortedExamples.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">
          Пока нет примеров. Добавьте удачные письма — их можно выбрать на вкладке «Генератор».
        </p>
      ) : (
        <ul className="space-y-2">
          {sortedExamples.map((example) => (
            <li key={example.id} className="rounded-2xl border border-border p-3">
              {editingId === example.id ? (
                <div className="space-y-2">
                  <Field
                    label="Заголовок"
                    placeholder="Заголовок"
                    value={editTitle}
                    onChange={setEditTitle}
                  />
                  <textarea
                    rows={5}
                    value={editLetter}
                    onChange={(event) => setEditLetter(event.target.value)}
                    className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none focus:border-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void saveEdit()}
                      className="flex-1 rounded-xl bg-primary py-2 text-[12px] text-primary-foreground"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-xl border border-border px-3 py-2 text-[12px]"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void toggleExampleFavorite(example.id)}
                          className={`text-[14px] leading-none ${
                            example.favorite ? "text-amber-500" : "text-muted-foreground"
                          }`}
                          aria-label={example.favorite ? "Убрать из избранного" : "В избранное"}
                        >
                          {example.favorite ? "★" : "☆"}
                        </button>
                        <span className="truncate text-[13px] font-medium">{example.title}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(example)}
                        className="rounded-lg border border-border px-2 py-1 text-[11px]"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteExample(example.id)}
                        className="rounded-lg border border-border px-2 py-1 text-[11px] text-red-600"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                  <p className="line-clamp-4 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                    {example.letter}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
