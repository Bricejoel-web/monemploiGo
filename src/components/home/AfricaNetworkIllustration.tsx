const CITIES = [
  { name: "Dakar", x: 40, y: 90 },
  { name: "Abidjan", x: 95, y: 165 },
  { name: "Lagos", x: 150, y: 175 },
  { name: "Douala", x: 195, y: 210 },
  { name: "Kinshasa", x: 240, y: 280 },
  { name: "Nairobi", x: 320, y: 230 },
  { name: "Abidjan-Alt", x: 300, y: 330, hidden: true },
];

const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
];

export function AfricaNetworkIllustration() {
  return (
    <svg viewBox="0 0 380 380" className="h-full w-full" role="img" aria-label="Réseau de villes africaines connectées">
      <defs>
        <radialGradient id="blob" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#f3d9b1" />
          <stop offset="55%" stopColor="#e3b27a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e3b27a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="190" cy="190" r="180" fill="url(#blob)" className="animate-float-slow" />

      {LINKS.map(([a, b], i) => (
        <line
          key={i}
          x1={CITIES[a].x}
          y1={CITIES[a].y}
          x2={CITIES[b].x}
          y2={CITIES[b].y}
          stroke="#b5502e"
          strokeOpacity={0.35}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      ))}

      {CITIES.filter((c) => !c.hidden).map((city) => (
        <g key={city.name}>
          <circle cx={city.x} cy={city.y} r={9} fill="#b5502e" opacity={0.18} className="animate-dot-pulse" />
          <circle cx={city.x} cy={city.y} r={4.5} fill="#b5502e" />
          <text x={city.x + 10} y={city.y + 4} fontSize={11} fill="currentColor" fontWeight={600}>
            {city.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
