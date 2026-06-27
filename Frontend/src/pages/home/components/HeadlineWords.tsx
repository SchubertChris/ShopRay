// ── Helpers ───────────────────────────────────────────────────────────────

export function HeadlineWords({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="hw" style={{ '--i': i } as React.CSSProperties}>
          <span className="hw__inner">{word}{i < words.length - 1 ? ' ' : ''}</span>
        </span>
      ))}
    </>
  );
}
