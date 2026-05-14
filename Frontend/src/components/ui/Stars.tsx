interface StarsProps {
  rating: number;
  size?: number;
}

export function Stars({ rating, size = 14 }: StarsProps) {
  const sizeClass = size <= 13 ? ' stars--sm' : size >= 16 ? ' stars--lg' : '';
  return (
    <span className={`stars${sizeClass}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={i <= Math.round(rating) ? 'stars__star stars__star--active' : 'stars__star'}
        >
          ★
        </span>
      ))}
    </span>
  );
}
