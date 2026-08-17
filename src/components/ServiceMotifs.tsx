import type { ServiceKey } from '../translations';

/**
 * Decorative line-work etched into each service card.
 *
 * Every motif is drawn in a 280x200 viewBox, which is exactly the cards' 1.4
 * aspect ratio — so the artwork maps to the card edge-for-edge at any size and
 * hairlines never distort.
 *
 * These are ornament, not information: the whole layer is aria-hidden, kept to
 * thin monochrome strokes, and masked away beneath the text block by the caller.
 */

const STROKE = 'currentColor';

/** HVAC and plumbing runs, cropped as if lifted off an engineering drawing. */
function BlueprintPipework() {
  return (
    <g fill="none" stroke={STROKE} strokeWidth="1" vectorEffect="non-scaling-stroke">
      {/* Two pipe runs entering from the right edge with rounded elbows */}
      <path d="M280 40 H222 q-8 0 -8 8 V92 q0 8 -8 8 H150" strokeWidth="1.4" />
      <path d="M280 132 H252 q-8 0 -8 -8 V70 q0 -8 -8 -8 H198" opacity="0.7" />

      {/* Inline valve, drawn as the usual bow-tie symbol */}
      <path d="M206 100 l8 -5 v10 z M222 100 l-8 -5 v10 z" fill={STROKE} opacity="0.55" stroke="none" />

      {/* Pressure gauge tapped off the upper run */}
      <circle cx="250" cy="40" r="7" opacity="0.75" />
      <path d="M250 40 l4 -4" opacity="0.75" />
      <circle cx="250" cy="40" r="1" fill={STROKE} stroke="none" opacity="0.75" />

      {/* Flange plates */}
      <path d="M214 56 h-6 m6 12 h-6" opacity="0.5" />

      {/* Dimension line with end ticks along the top edge */}
      <g opacity="0.45">
        <path d="M152 16 H268" />
        <path d="M152 11 v10 M268 11 v10" />
        <path d="M182 13 v6 M212 13 v6 M242 13 v6" opacity="0.6" />
      </g>

      {/* Section marker */}
      <g opacity="0.4">
        <path d="M268 168 h-30 v-18" />
        <circle cx="238" cy="168" r="3" />
      </g>
    </g>
  );
}

/** Concentric secure zones, echoing the card's own silhouette. */
function PerimeterRings() {
  const rings = [
    { inset: 9, rx: 15, dash: '46 14', opacity: 0.75 },
    { inset: 21, rx: 13, dash: '30 16', opacity: 0.55 },
    { inset: 33, rx: 11, dash: '18 14', opacity: 0.4 },
    { inset: 45, rx: 9, dash: '10 12', opacity: 0.28 },
  ];

  return (
    <g fill="none" stroke={STROKE} strokeWidth="1" vectorEffect="non-scaling-stroke">
      {rings.map((r, i) => (
        <rect
          key={i}
          x={r.inset}
          y={r.inset}
          width={280 - r.inset * 2}
          height={200 - r.inset * 2}
          rx={r.rx}
          strokeDasharray={r.dash}
          opacity={r.opacity}
        />
      ))}

      {/* Corner brackets, marking the controlled entry points */}
      <g opacity="0.85" strokeWidth="1.6">
        <path d="M9 30 V18 a9 9 0 0 1 9 -9 H30" />
        <path d="M250 9 h12 a9 9 0 0 1 9 9 V30" />
        <path d="M271 170 v12 a9 9 0 0 1 -9 9 H250" />
        <path d="M30 191 H18 a9 9 0 0 1 -9 -9 V170" />
      </g>
    </g>
  );
}

/** A vine climbing the left edge and turning along the top. */
function ClimbingVine() {
  // Leaves are placed by hand along the stem, alternating sides with uneven
  // spacing and scale — evenly spaced leaves read as a repeating pattern
  // rather than as something grown.
  const leaves: Array<{ x: number; y: number; r: number; s: number }> = [
    { x: 24, y: 158, r: -38, s: 1.0 },
    { x: 31, y: 124, r: 145, s: 0.82 },
    { x: 30, y: 92, r: -28, s: 0.95 },
    { x: 45, y: 58, r: 158, s: 0.78 },
    { x: 66, y: 34, r: -16, s: 0.9 },
    { x: 104, y: 20, r: 168, s: 0.72 },
    { x: 143, y: 13, r: -12, s: 0.85 },
    { x: 196, y: 9, r: 172, s: 0.68 },
  ];

  return (
    <g fill="none" stroke={STROKE} strokeWidth="1" vectorEffect="non-scaling-stroke">
      {/* Main stem: up the left edge, then a long turn across the top */}
      <path
        d="M14 206 C 30 178 18 150 30 126 C 42 102 24 76 44 54 C 58 38 84 26 114 18 C 156 7 212 9 258 3"
        strokeWidth="1.5"
        opacity="0.9"
      />
      {/* A shorter offshoot */}
      <path d="M31 118 C 48 112 58 96 56 78" opacity="0.5" />
      {/* Tendril curl */}
      <path d="M120 17 c 6 -7 14 -6 15 1 c 1 6 -7 8 -9 3 c -1 -4 3 -6 5 -3" opacity="0.45" />

      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`} opacity="0.8">
          {/* Lens-shaped leaf with a midrib */}
          <path d="M0 0 C 7 -9 20 -9 25 0 C 20 9 7 9 0 0 Z" />
          <path d="M2 0 H22" opacity="0.55" />
        </g>
      ))}
    </g>
  );
}

/** A loose network of nodes: everything else, joined up. */
function ServiceLattice() {
  const nodes: Array<[number, number]> = [
    [232, 26], [268, 52], [206, 58], [246, 86],
    [274, 118], [212, 104], [178, 34], [240, 140],
    [190, 78], [268, 20],
  ];
  // Indices into `nodes`, kept irregular so it reads as a network rather than a grid.
  const edges: Array<[number, number]> = [
    [0, 1], [0, 2], [2, 3], [1, 3], [3, 4], [2, 5],
    [5, 3], [6, 2], [0, 6], [3, 7], [5, 8], [8, 6], [1, 9], [0, 9],
  ];

  return (
    <g fill="none" stroke={STROKE} strokeWidth="1" vectorEffect="non-scaling-stroke">
      <g opacity="0.4">
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
        ))}
      </g>
      {nodes.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i % 3 === 0 ? 2.6 : 1.7}
          fill={i % 3 === 0 ? STROKE : 'none'}
          opacity={i % 3 === 0 ? 0.75 : 0.6}
        />
      ))}
      {/* One ring picking out a hub */}
      <circle cx={nodes[3][0]} cy={nodes[3][1]} r="8" opacity="0.3" />
    </g>
  );
}

const MOTIFS: Record<ServiceKey, () => React.JSX.Element> = {
  technical: BlueprintPipework,
  security: PerimeterRings,
  landscaping: ClimbingVine,
  other: ServiceLattice,
};

export default function ServiceMotif({ serviceKey }: { serviceKey: ServiceKey }) {
  const Motif = MOTIFS[serviceKey];
  if (!Motif) return null;

  return (
    <svg
      viewBox="0 0 280 200"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full text-white pointer-events-none"
      aria-hidden="true"
      focusable="false"
    >
      <Motif />
    </svg>
  );
}
