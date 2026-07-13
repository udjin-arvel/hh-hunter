export default function App() {
  return (
    <main className="flex min-h-[420px] w-[400px] flex-col bg-slate-950 px-6 py-8 text-slate-100">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">HH-Hunter</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Каркас готов</h1>
      </header>

      <p className="text-sm leading-relaxed text-slate-300">
        Расширение установлено. В следующих итерациях здесь появятся вкладки профиля, генератора и
        настроек API.
      </p>

      <div className="mt-auto rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
        Итерация 1 · MV3 service worker активен
      </div>
    </main>
  );
}
