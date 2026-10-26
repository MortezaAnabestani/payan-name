export function ThreeDrops({
  className = "",
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  const strength = Math.max(0.35, Math.min(1, intensity));
  return (
    <svg
      className={className}
      viewBox="0 0 260 320"
      role="img"
      aria-label="سه قطره خون روی کاغذ"
      style={{ opacity: 0.55 + strength * 0.45 }}
    >
      <defs>
        <radialGradient id="drop" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#a64248" />
          <stop offset="55%" stopColor="#7d252d" />
          <stop offset="100%" stopColor="#3f1118" />
        </radialGradient>
        <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <path
        d="M130 42c9 0 20 22 27 47 8 29 13 48 1 62-8 9-19 14-28 14s-20-5-28-14c-12-14-7-33 1-62 7-25 18-47 27-47Z"
        fill="url(#drop)"
        opacity={0.6 + strength * 0.36}
      />
      <path
        d="M97 132c7 0 15 16 20 34 6 21 9 35 1 45-6 7-14 10-21 10s-15-3-21-10c-8-10-5-24 1-45 5-18 13-34 20-34Z"
        fill="url(#drop)"
        opacity={0.45 + strength * 0.35}
        filter="url(#soft)"
      />
      <path
        d="M163 150c6 0 13 14 17 30 5 19 8 31 1 40-5 6-12 9-18 9s-13-3-18-9c-7-9-4-21 1-40 4-16 11-30 17-30Z"
        fill="url(#drop)"
        opacity={0.38 + strength * 0.4}
        filter="url(#soft)"
      />
    </svg>
  );
}
