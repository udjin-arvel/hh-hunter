interface ProfilePreviewProps {
  text: string;
}

export function ProfilePreview({ text }: ProfilePreviewProps) {
  return (
    <div className="rounded-xl bg-surface p-3 text-[11px] text-muted-foreground">
      <div className="mb-1 font-medium text-foreground">Сохранённый контекст</div>
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}
