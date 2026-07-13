export function LogoMark({ small }: { small?: boolean }) {
  const size = small ? 18 : 22;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 18 L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 14 L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
