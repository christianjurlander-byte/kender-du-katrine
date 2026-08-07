export function Badge18({ large }: { large?: boolean }) {
  return (
    <span className={`badge-18${large ? " badge-18-lg" : ""}`}>
      🎈 18 ÅR 🎈
    </span>
  );
}
