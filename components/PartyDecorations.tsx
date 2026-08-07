interface BalloonSpec {
  top: string;
  left?: string;
  right?: string;
  width: number;
  height: number;
  gradient: string;
  delay: string;
  opacity: number;
  hideOnMobile?: boolean;
}

const BALLOONS: BalloonSpec[] = [
  {
    top: "6%",
    left: "4%",
    width: 46,
    height: 58,
    gradient: "linear-gradient(135deg, var(--party-purple), var(--party-pink))",
    delay: "0s",
    opacity: 0.55,
  },
  {
    top: "9%",
    right: "6%",
    width: 40,
    height: 52,
    gradient: "linear-gradient(135deg, var(--party-gold), var(--party-yellow))",
    delay: "1.2s",
    opacity: 0.55,
    hideOnMobile: true,
  },
  {
    top: "68%",
    left: "3%",
    width: 38,
    height: 50,
    gradient: "linear-gradient(135deg, var(--party-pink), var(--party-gold))",
    delay: "2.1s",
    opacity: 0.5,
    hideOnMobile: true,
  },
  {
    top: "78%",
    right: "5%",
    width: 44,
    height: 56,
    gradient: "linear-gradient(135deg, var(--party-purple), var(--party-gold))",
    delay: "0.6s",
    opacity: 0.55,
  },
  {
    top: "38%",
    left: "1%",
    width: 28,
    height: 38,
    gradient: "linear-gradient(135deg, var(--party-gold), var(--party-pink))",
    delay: "1.8s",
    opacity: 0.4,
    hideOnMobile: true,
  },
  {
    top: "48%",
    right: "2%",
    width: 32,
    height: 42,
    gradient: "linear-gradient(135deg, var(--party-pink), var(--party-purple))",
    delay: "2.6s",
    opacity: 0.4,
    hideOnMobile: true,
  },
];

/**
 * Purely decorative, fixed-position balloons floating in the page margins.
 * pointer-events: none so they never block taps; z-index 0 + rendered first
 * in the layout so ordinary page content (drawn after, no z-index) stacks
 * above them automatically.
 */
export function PartyDecorations() {
  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
      {BALLOONS.map((b, i) => (
        <div
          key={i}
          className={`balloon${b.hideOnMobile ? " balloon-hide-mobile" : ""}`}
          style={{
            top: b.top,
            left: b.left,
            right: b.right,
            width: b.width,
            height: b.height,
            background: b.gradient,
            opacity: b.opacity,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  );
}
