import React from 'react';

// Hand-drawn top-down illustrations of every dish, drawn as inline SVG so
// they are always available (no hot-linked photos to break). To use a real
// photo for a dish instead, set `photo: '/images/foods/<id>.jpg'` on it in
// data/foods.js — FoodImage prefers that automatically.

// ---- tiny helpers ---------------------------------------------------------
const rng = (seed) => {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// Scatter `n` shapes inside a circle. `draw(x, y, rand, i)` returns an element.
const Scatter = ({ seed, n, cx, cy, r, draw }) => {
  const rand = rng(seed);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = rand() * Math.PI * 2;
        const d = Math.sqrt(rand()) * r;
        return <g key={i}>{draw(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rand, i)}</g>;
      })}
    </g>
  );
};

const Shadow = ({ cx, cy, rx, ry = rx }) => <ellipse cx={cx + 3} cy={cy + 6} rx={rx} ry={ry} fill="#2b1d10" opacity="0.16" />;

const Plate = ({ cx = 120, cy = 90, r = 64, fill = '#FFFFFF', rim = '#ECE6DC' }) => (
  <g>
    <Shadow cx={cx} cy={cy} rx={r} />
    <circle cx={cx} cy={cy} r={r} fill={rim} />
    <circle cx={cx} cy={cy} r={r - 7} fill={fill} />
  </g>
);

const Bowl = ({ cx, cy, r, rim = '#F2EDE4', inner = '#DCD3C4', content, children }) => (
  <g>
    <Shadow cx={cx} cy={cy} rx={r} />
    <circle cx={cx} cy={cy} r={r} fill={rim} />
    <circle cx={cx} cy={cy} r={r - 4} fill={inner} />
    <circle cx={cx} cy={cy} r={r - 7} fill={content} />
    <ellipse cx={cx - r * 0.3} cy={cy - r * 0.35} rx={r * 0.3} ry={r * 0.12} fill="#fff" opacity="0.18" />
    {children}
  </g>
);

const Herb = ({ x, y, c = '#3E8E41' }) => <ellipse cx={x} cy={y} rx="2.4" ry="1.2" fill={c} transform={`rotate(${(x * 7) % 180} ${x} ${y})`} />;

const Roti = ({ cx, cy, r, fill = '#E9C48B', spots = '#B57B3B', seed = 1 }) => (
  <g>
    <circle cx={cx + 1.5} cy={cy + 3} r={r} fill="#2b1d10" opacity="0.14" />
    <circle cx={cx} cy={cy} r={r} fill={fill} />
    <circle cx={cx} cy={cy} r={r - 3} fill={fill} stroke="#fff" strokeOpacity="0.25" />
    <Scatter seed={seed} n={9} cx={cx} cy={cy} r={r - 5} draw={(x, y, rd) => <circle cx={x} cy={y} r={1 + rd() * 2.2} fill={spots} opacity="0.75" />} />
  </g>
);

const Cube = ({ x, y, s = 9, fill = '#FBF3DC', rot = 0 }) => (
  <g transform={`rotate(${rot} ${x} ${y})`}>
    <rect x={x - s / 2 + 1} y={y - s / 2 + 1.5} width={s} height={s} rx="2" fill="#000" opacity="0.15" />
    <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx="2" fill={fill} />
    <rect x={x - s / 2} y={y - s / 2} width={s} height={s / 2.5} rx="2" fill="#fff" opacity="0.35" />
  </g>
);

const Grains = ({ seed, n = 60, cx, cy, r, colors = ['#FFFDF6'] }) => (
  <Scatter seed={seed} n={n} cx={cx} cy={cy} r={r} draw={(x, y, rd, i) => (
    <ellipse cx={x} cy={y} rx="3.2" ry="1.3" fill={colors[i % colors.length]} stroke="#000" strokeOpacity="0.08" strokeWidth="0.4" transform={`rotate(${rd() * 180} ${x} ${y})`} />
  )} />
);

const Steam = ({ x, y }) => (
  <g fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.2" strokeLinecap="round">
    <path d={`M${x - 8} ${y} q-5 -8 0 -15 q5 -7 0 -14`} />
    <path d={`M${x + 4} ${y + 2} q-5 -8 0 -15 q5 -7 0 -14`} />
  </g>
);

// ---- dish scenes (viewBox 0 0 240 180, dish centred near 120,90) ----------
const scenes = {
  // Dal & ghee phulka thali
  f01: () => (
    <>
      <Plate r={68} fill="#E4E9ED" rim="#B7C1C9" />
      <Bowl cx={88} cy={68} r={20} rim="#CBD3DA" inner="#B7C1C9" content="#EBB92A"><circle cx="88" cy="66" r="5" fill="#F7E7A0" opacity="0.8" /></Bowl>
      <Roti cx={150} cy={72} r={21} seed={2} /><Roti cx={158} cy={80} r={19} seed={5} />
      <g><ellipse cx="136" cy="118" rx="22" ry="15" fill="#FFFDF6" /><Grains seed={3} n={30} cx={136} cy={116} r={16} colors={['#FFFDF6', '#F1E4B8']} /></g>
      <g><circle cx="90" cy="118" r="15" fill="#F6F1E4" /><circle cx="84" cy="114" r="5" fill="#D8483B" /><circle cx="95" cy="119" r="4.5" fill="#E9F0D2" /><circle cx="88" cy="123" r="4" fill="#9CC04B" /></g>
    </>
  ),
  // South Indian thali on banana leaf
  f02: () => (
    <>
      <Shadow cx={120} cy={92} rx={92} ry={66} />
      <ellipse cx="120" cy="90" rx="92" ry="66" fill="#4C9A4F" />
      <path d="M40 90 H200" stroke="#3C7E3F" strokeWidth="2" />
      <ellipse cx="120" cy="90" rx="84" ry="58" fill="#5DAA5A" opacity="0.6" />
      <g><ellipse cx="86" cy="96" rx="24" ry="16" fill="#FFFDF6" /><Grains seed={8} n={36} cx={86} cy={95} r={18} /></g>
      <Bowl cx={140} cy={64} r={15} rim="#C9D0D6" inner="#AEB8C0" content="#D98E2F" />
      <Bowl cx={172} cy={88} r={12} rim="#C9D0D6" inner="#AEB8C0" content="#F5F1E6" />
      <Bowl cx={70} cy={58} r={12} rim="#C9D0D6" inner="#AEB8C0" content="#C7432E" />
      <Scatter seed={4} n={10} cx={132} cy={112} r={13} draw={(x, y) => <circle cx={x} cy={y} r="3" fill="#7FB03A" />} />
      <circle cx="160" cy="118" r="13" fill="#F2DDA6" stroke="#D3B565" /><Scatter seed={9} n={8} cx={160} cy={118} r={9} draw={(x, y) => <circle cx={x} cy={y} r="1.3" fill="#B98F3A" />} />
    </>
  ),
  // Rajma chawal
  f03: () => (
    <>
      <Plate r={66} />
      <ellipse cx="98" cy="98" rx="30" ry="26" fill="#000" opacity="0.1" /><ellipse cx="96" cy="94" rx="30" ry="26" fill="#F6F0DE" stroke="#E3D9BE" strokeWidth="1.5" /><Grains seed={4} n={46} cx={96} cy={92} r={24} />
      <path d="M118 58 Q170 60 172 96 Q168 132 122 128 Q140 92 118 58Z" fill="#8B2F1C" />
      <Scatter seed={7} n={22} cx={148} cy={94} r={22} draw={(x, y, rd) => <ellipse cx={x} cy={y} rx="4.2" ry="2.6" fill="#A8432A" stroke="#5E1B0E" strokeWidth="0.6" transform={`rotate(${rd() * 180} ${x} ${y})`} />} />
      <Herb x={104} y={72} /><Herb x={90} y={80} /><Herb x={100} y={84} />
    </>
  ),
  // Butter chicken
  f04: () => (
    <>
      <Bowl cx={120} cy={90} r={64} rim="#F4EEE5" inner="#E0D6C6" content="#D9682A" />
      <circle cx="120" cy="90" r="46" fill="#E27B34" opacity="0.7" />
      {[[100, 78, 20], [140, 84, 60], [116, 108, 110], [146, 110, 30], [96, 100, 75]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}><rect x={x - 11} y={y - 8} width="22" height="16" rx="7" fill="#B8481B" /><rect x={x - 8} y={y - 5} width="10" height="4" rx="2" fill="#E9945A" opacity="0.7" /></g>
      ))}
      <path d="M92 76 q14 -12 30 -2 q12 8 22 -2" fill="none" stroke="#FFF3DE" strokeWidth="4" strokeLinecap="round" />
      <Scatter seed={3} n={9} cx={120} cy={90} r={40} draw={(x, y) => <Herb x={x} y={y} />} />
    </>
  ),
  // Kolkata mustard fish curry
  f05: () => (
    <>
      <Bowl cx={120} cy={90} r={64} rim="#F1EBE0" inner="#D9CFBE" content="#D9B23A" />
      <circle cx="120" cy="90" r="48" fill="#C9A22C" opacity="0.55" />
      {[[98, 82, -20], [136, 76, 25], [118, 108, 5]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}><rect x={x - 17} y={y - 10} width="34" height="20" rx="9" fill="#F3E6C9" /><path d={`M${x - 12} ${y - 4} h24 M${x - 12} ${y + 3} h24`} stroke="#D9C08E" strokeWidth="1.5" /></g>
      ))}
      {[[86, 108], [150, 100], [128, 66]].map(([x, y], i) => <path key={i} d={`M${x} ${y} q12 -6 24 2`} stroke="#4F9A3B" strokeWidth="3.4" strokeLinecap="round" fill="none" />)}
    </>
  ),
  // Palak paneer
  f06: () => (
    <>
      <Bowl cx={120} cy={90} r={64} rim="#F3EEE6" inner="#DCD2C1" content="#3F7A34" />
      <circle cx="120" cy="90" r="46" fill="#2F6A2B" opacity="0.55" />
      {[[96, 78, 10], [136, 76, -14], [104, 108, 30], [142, 104, 5], [120, 92, 20]].map(([x, y, r], i) => <Cube key={i} x={x} y={y} s={17} rot={r} fill="#FBF3DC" />)}
      <path d="M86 92 q18 -14 34 -4 q16 8 34 -6" fill="none" stroke="#FFF6E2" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  // Paneer dum biryani in a claypot
  f07: () => (
    <>
      <Shadow cx={120} cy={90} rx={66} />
      <circle cx="120" cy="90" r="66" fill="#9C4A25" /><circle cx="120" cy="90" r="60" fill="#B85E31" />
      <circle cx="120" cy="90" r="50" fill="#F1DFA6" />
      <Grains seed={12} n={90} cx={120} cy={90} r={46} colors={['#FFFDF6', '#F3D678', '#FFFDF6', '#E98B3B']} />
      {[[100, 74, 12], [140, 82, -10], [112, 108, 25], [146, 108, 8]].map(([x, y, r], i) => <Cube key={i} x={x} y={y} s={13} rot={r} fill="#FBF0CE" />)}
      <Scatter seed={5} n={12} cx={120} cy={90} r={42} draw={(x, y) => <Herb x={x} y={y} c="#2E8B3E" />} />
      <Scatter seed={6} n={10} cx={120} cy={90} r={40} draw={(x, y) => <circle cx={x} cy={y} r="2.2" fill="#7A3E14" opacity="0.85" />} />
    </>
  ),
  // Hyderabadi chicken dum biryani
  f08: () => (
    <>
      <Plate r={68} fill="#F5F0E6" rim="#DDD4C3" />
      <ellipse cx="120" cy="92" rx="50" ry="44" fill="#F2DE9A" />
      <Grains seed={15} n={110} cx={120} cy={92} r={44} colors={['#FFFDF6', '#F3D678', '#FFFDF6', '#E98B3B', '#FFFDF6']} />
      {[[100, 76, 10], [142, 84, -20], [108, 108, 40], [138, 112, 0]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}><ellipse cx={x} cy={y} rx="15" ry="10" fill="#A8471D" /><ellipse cx={x - 3} cy={y - 3} rx="7" ry="3" fill="#D98A54" opacity="0.7" /></g>
      ))}
      <Scatter seed={9} n={16} cx={120} cy={92} r={40} draw={(x, y, rd) => <rect x={x} y={y} width="6" height="1.8" rx="0.9" fill="#7B4A1A" transform={`rotate(${rd() * 180} ${x} ${y})`} />} />
      <Scatter seed={10} n={8} cx={120} cy={92} r={40} draw={(x, y) => <Herb x={x} y={y} />} />
    </>
  ),
  // Lemon coconut rice
  f09: () => (
    <>
      <Plate r={66} />
      <ellipse cx="120" cy="92" rx="44" ry="38" fill="#F6DD5A" />
      <Grains seed={21} n={80} cx={120} cy={92} r={38} colors={['#F8E36F', '#F2D13F', '#FBEF9A']} />
      <Scatter seed={22} n={12} cx={120} cy={92} r={34} draw={(x, y) => <circle cx={x} cy={y} r="2.6" fill="#D6A05A" />} />
      <Scatter seed={23} n={10} cx={120} cy={92} r={34} draw={(x, y) => <Herb x={x} y={y} c="#2F7A2A" />} />
      <Scatter seed={24} n={14} cx={120} cy={92} r={36} draw={(x, y) => <rect x={x} y={y} width="5" height="2" rx="1" fill="#FFFFFF" />} />
      <g transform="translate(160 62)"><circle r="12" fill="#F9E04B" /><circle r="9.5" fill="#FCF0A0" /><path d="M0 -9 V9 M-9 0 H9 M-6.4 -6.4 L6.4 6.4 M6.4 -6.4 L-6.4 6.4" stroke="#F0D25A" strokeWidth="1.2" /></g>
    </>
  ),
  // Butter garlic naan
  f10: () => (
    <>
      <Plate r={68} fill="#F5F0E6" rim="#DDD4C3" />
      {[[110, 82, -18], [130, 104, 14]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x - 42} ${y} Q${x - 30} ${y - 26} ${x + 6} ${y - 24} Q${x + 40} ${y - 18} ${x + 46} ${y} Q${x + 36} ${y + 24} ${x} ${y + 22} Q${x - 34} ${y + 24} ${x - 42} ${y}Z`} fill="#EBC98C" stroke="#D7A85C" strokeWidth="1.5" />
          <Scatter seed={30 + i} n={9} cx={x} cy={y} r={26} draw={(px, py, rd) => <ellipse cx={px} cy={py} rx={2 + rd() * 3} ry={1.5 + rd() * 2} fill="#9A5B22" opacity="0.7" />} />
          <Scatter seed={40 + i} n={12} cx={x} cy={y} r={28} draw={(px, py) => <circle cx={px} cy={py} r="1.4" fill="#5AA03A" />} />
        </g>
      ))}
      <rect x="100" y="70" width="14" height="10" rx="2" fill="#FBE58A" transform="rotate(-18 107 75)" />
    </>
  ),
  // Tandoori roti stack
  f11: () => (
    <>
      <Plate r={68} fill="#F5F0E6" rim="#DDD4C3" />
      <Roti cx={112} cy={96} r={40} seed={3} fill="#DDB170" spots="#8A5424" />
      <Roti cx={120} cy={88} r={40} seed={4} fill="#E4B978" spots="#8A5424" />
      <Roti cx={128} cy={80} r={40} seed={6} fill="#EBC486" spots="#8A5424" />
      <rect x="132" y="70" width="16" height="10" rx="2" fill="#FBE58A" transform="rotate(20 140 75)" />
    </>
  ),
  // Masala dosa
  f12: () => (
    <>
      <Plate r={70} fill="#E4E9ED" rim="#B7C1C9" />
      <path d="M36 112 Q120 46 204 78 Q214 88 204 98 Q120 136 46 124 Q30 120 36 112Z" fill="#D89A45" stroke="#B87A2C" strokeWidth="2" />
      <path d="M50 112 Q120 62 198 84" fill="none" stroke="#F0BC6B" strokeWidth="5" opacity="0.8" strokeLinecap="round" />
      <Scatter seed={11} n={18} cx={120} cy={98} r={54} draw={(x, y, rd) => <circle cx={x} cy={y} r={1 + rd() * 2} fill="#A9651E" opacity="0.6" />} />
      <Bowl cx={70} cy={40} r={13} rim="#C9D0D6" inner="#AEB8C0" content="#F6F2E8" />
      <Bowl cx={150} cy={38} r={13} rim="#C9D0D6" inner="#AEB8C0" content="#C9552B" />
    </>
  ),
  // Poha with sev
  f13: () => (
    <>
      <Plate r={66} />
      <ellipse cx="120" cy="92" rx="46" ry="38" fill="#F2CF3A" />
      <Scatter seed={31} n={60} cx={120} cy={92} r={42} draw={(x, y, rd) => <ellipse cx={x} cy={y} rx="4" ry="2" fill={rd() > 0.5 ? '#F7DC63' : '#EDBE22'} transform={`rotate(${rd() * 180} ${x} ${y})`} />} />
      <Scatter seed={32} n={30} cx={120} cy={90} r={34} draw={(x, y, rd) => <path d={`M${x} ${y} q4 -3 8 0`} stroke="#D9A24A" strokeWidth="1.3" fill="none" transform={`rotate(${rd() * 180} ${x} ${y})`} />} />
      <Scatter seed={33} n={10} cx={120} cy={92} r={34} draw={(x, y) => <circle cx={x} cy={y} r="2.4" fill="#C98A4B" />} />
      <Scatter seed={34} n={9} cx={120} cy={92} r={34} draw={(x, y) => <Herb x={x} y={y} />} />
      <g transform="translate(166 122) rotate(-25)"><path d="M0 0 Q14 -10 28 0 Q14 6 0 0Z" fill="#F9E04B" /></g>
    </>
  ),
  // Stuffed aloo paratha
  f14: () => (
    <>
      <Plate r={68} fill="#F5F0E6" rim="#DDD4C3" />
      <Roti cx={106} cy={98} r={36} seed={7} fill="#E3B872" spots="#A2622A" />
      <Roti cx={126} cy={80} r={36} seed={8} fill="#EBC486" spots="#A2622A" />
      <rect x="120" y="70" width="18" height="11" rx="3" fill="#FBE58A" /><rect x="120" y="70" width="18" height="4" rx="2" fill="#fff" opacity="0.45" />
      <Bowl cx={178} cy={128} r={15} rim="#F2EDE4" inner="#DCD3C4" content="#FBFAF3" />
    </>
  ),
  // Samosa
  f15: () => (
    <>
      <Plate r={66} fill="#F5F0E6" rim="#DDD4C3" />
      {[[100, 92, -12], [138, 84, 10]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x} ${y - 30} L${x + 30} ${y + 22} L${x - 30} ${y + 22}Z`} fill="#D99A3A" stroke="#B7761F" strokeWidth="2" strokeLinejoin="round" />
          <path d={`M${x} ${y - 22} L${x + 21} ${y + 16} L${x - 21} ${y + 16}Z`} fill="#E8B356" opacity="0.7" />
          <Scatter seed={50 + i} n={12} cx={x} cy={y + 6} r={18} draw={(px, py, rd) => <circle cx={px} cy={py} r={0.8 + rd() * 1.6} fill="#A7651B" opacity="0.7" />} />
        </g>
      ))}
      <Bowl cx={172} cy={128} r={14} rim="#F2EDE4" inner="#DCD3C4" content="#4C9A3B" />
    </>
  ),
  // Pakora platter
  f16: () => (
    <>
      <Plate r={70} fill="#F5F0E6" rim="#DDD4C3" />
      {[[92, 70, 20], [122, 62, -30], [150, 82, 60], [100, 100, -10], [130, 98, 35], [84, 128, 80], [116, 132, 0], [148, 120, -50], [166, 100, 15]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx={13 + (i % 3) * 2} ry={9 + (i % 2) * 2} fill={i % 2 ? '#D6902F' : '#C67F22'} stroke="#9E5F14" strokeWidth="1" />
          <circle cx={x - 3} cy={y - 2} r="2.4" fill="#F0BE6A" opacity="0.8" />
        </g>
      ))}
      <path d="M156 128 q12 -8 26 0" stroke="#4F9A3B" strokeWidth="4" strokeLinecap="round" fill="none" />
      <Bowl cx={176} cy={56} r={13} rim="#F2EDE4" inner="#DCD3C4" content="#3F8A36" />
    </>
  ),
  // Gulab jamun
  f17: () => (
    <>
      <Bowl cx={120} cy={90} r={62} rim="#F4EEE5" inner="#E0D6C6" content="#C9822B" />
      <circle cx="120" cy="90" r="46" fill="#D89A3E" opacity="0.7" />
      {[[100, 76], [140, 76], [100, 108], [140, 108]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="17" fill="#5A2412" /><circle cx={x - 5} cy={y - 5} r="6" fill="#8B4526" opacity="0.8" /><circle cx={x} cy={y} r="17" fill="none" stroke="#3B1508" strokeWidth="1" /></g>
      ))}
      <Scatter seed={13} n={10} cx={120} cy={92} r={38} draw={(x, y) => <rect x={x} y={y} width="4" height="1.6" rx="0.8" fill="#6BA34A" />} />
    </>
  ),
  // Kesar rasmalai
  f18: () => (
    <>
      <Bowl cx={120} cy={90} r={64} rim="#F4EEE5" inner="#E0D6C6" content="#F8EBC4" />
      <circle cx="120" cy="90" r="46" fill="#F6E3A5" opacity="0.8" />
      {[[104, 84, -10], [138, 98, 12]].map(([x, y, r], i) => <g key={i} transform={`rotate(${r} ${x} ${y})`}><ellipse cx={x} cy={y} rx="26" ry="20" fill="#FFFDF3" stroke="#EADFC0" strokeWidth="1.5" /><ellipse cx={x - 6} cy={y - 7} rx="10" ry="4" fill="#fff" /></g>)}
      <Scatter seed={17} n={22} cx={120} cy={90} r={30} draw={(x, y) => <rect x={x} y={y} width="4" height="2" rx="1" fill="#7DB04A" />} />
      <Scatter seed={18} n={8} cx={120} cy={90} r={34} draw={(x, y) => <path d={`M${x} ${y} l5 2`} stroke="#E88A1F" strokeWidth="1.5" strokeLinecap="round" />} />
    </>
  ),
  // Gajar halwa
  f19: () => (
    <>
      <Bowl cx={120} cy={90} r={62} rim="#F3EDE4" inner="#DCD2C1" content="#E2721C" />
      <circle cx="120" cy="90" r="46" fill="#E9852D" opacity="0.6" />
      <Scatter seed={71} n={60} cx={120} cy={92} r={42} draw={(x, y, rd) => <ellipse cx={x} cy={y} rx="6" ry="1.8" fill={rd() > 0.5 ? '#F29A3F' : '#CF5F14'} transform={`rotate(${rd() * 180} ${x} ${y})`} />} />
      <Scatter seed={72} n={8} cx={120} cy={90} r={36} draw={(x, y, rd) => <ellipse cx={x} cy={y} rx="5" ry="3" fill="#F3DFA8" stroke="#D2B472" transform={`rotate(${rd() * 180} ${x} ${y})`} />} />
      <Scatter seed={73} n={8} cx={120} cy={90} r={36} draw={(x, y) => <circle cx={x} cy={y} r="2.6" fill="#7A2C3A" />} />
    </>
  ),
  // Masala chaas (tall glass)
  f20: () => (
    <>
      <ellipse cx="120" cy="150" rx="40" ry="8" fill="#2b1d10" opacity="0.16" />
      <path d="M84 40 H156 L148 146 Q120 156 92 146Z" fill="#E8F1F2" opacity="0.6" stroke="#BFD3D6" strokeWidth="2" />
      <path d="M87 62 H153 L147 142 Q120 151 93 142Z" fill="#FBF8EC" />
      <path d="M87 62 H153" stroke="#EDE6CE" strokeWidth="3" />
      <Scatter seed={81} n={18} cx={120} cy={104} r={26} draw={(x, y) => <circle cx={x} cy={y} r="1.1" fill="#9A7A3A" />} />
      <Herb x={112} y={58} c="#2F8A3A" /><Herb x={124} y={54} c="#3E9A48" /><Herb x={130} y={60} c="#2F8A3A" />
      <path d="M92 50 L100 130" stroke="#fff" strokeWidth="3" opacity="0.5" strokeLinecap="round" />
    </>
  ),
  // Mango lassi
  f21: () => (
    <>
      <ellipse cx="120" cy="150" rx="40" ry="8" fill="#2b1d10" opacity="0.16" />
      <path d="M84 40 H156 L148 146 Q120 156 92 146Z" fill="#F4F0E4" opacity="0.6" stroke="#D6CDB8" strokeWidth="2" />
      <path d="M87 56 H153 L147 142 Q120 151 93 142Z" fill="#F7B92E" />
      <path d="M87 56 H153 L152 72 Q120 82 88 72Z" fill="#FBD262" />
      <path d="M150 12 L138 58" stroke="#D8483B" strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(158 52) rotate(20)"><path d="M0 0 Q18 4 20 22 Q8 20 0 0Z" fill="#F39A1E" /><path d="M2 3 Q14 6 16 18" stroke="#FCD27A" strokeWidth="2" fill="none" /></g>
      <path d="M92 50 L100 130" stroke="#fff" strokeWidth="3" opacity="0.5" strokeLinecap="round" />
    </>
  ),
  // Masala chai
  f22: () => (
    <>
      <Shadow cx={120} cy={100} rx={58} />
      <ellipse cx="120" cy="100" rx="58" ry="44" fill="#F1EBE0" stroke="#DCD3C4" strokeWidth="2" />
      <circle cx="112" cy="94" r="36" fill="#FFFFFF" /><circle cx="112" cy="94" r="36" fill="none" stroke="#E4DCCB" strokeWidth="2" />
      <circle cx="112" cy="94" r="30" fill="#B9793A" /><circle cx="112" cy="94" r="30" fill="#D19A5B" opacity="0.5" />
      <ellipse cx="102" cy="84" rx="12" ry="5" fill="#F0CFA0" opacity="0.6" />
      <path d="M148 88 q22 -2 20 12 q-2 12 -22 8" fill="none" stroke="#fff" strokeWidth="7" />
      <path d="M148 88 q22 -2 20 12 q-2 12 -22 8" fill="none" stroke="#E4DCCB" strokeWidth="1.5" />
      <g transform="translate(112 60)"><Steam x={0} y={0} /></g>
    </>
  )
};

// Warm table surface colour per category.
const surface = {
  breakfast: '#F1D3D0', lunch: '#F3D7B0', dinner: '#DCD3EE', snacks: '#F0DEA9',
  sweets: '#F0CFDE', drinks: '#CFE6DC', brunch: '#F3DDBC'
};

// Dishes without a hand-drawn scene (including anything the admin adds) get a plate with their emoji.
// Real photos from `npm run fetch-photos` replace this automatically.
const Fallback = ({ food }) => (
  <>
    <ellipse cx="120" cy="104" rx="74" ry="62" fill="#fff" fillOpacity="0.85" />
    <ellipse cx="120" cy="104" rx="58" ry="47" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="2" />
    <text x="120" y="124" textAnchor="middle" fontSize="64">{food.icon || '🍽️'}</text>
  </>
);

const DishImage = ({ food }) => {
  const Scene = scenes[food.id];
  const bg = surface[food.category] || '#EFE6D6';
  return (
    <svg viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice" role="img" aria-label={food.name} className="dish-svg">
      <rect width="240" height="180" fill={bg} />
      <g stroke="#fff" strokeOpacity="0.28" strokeWidth="2">
        {[20, 55, 90, 125, 160].map((y) => <path key={y} d={`M0 ${y} H240`} />)}
      </g>
      {Scene ? <Scene /> : <Fallback food={food} />}
    </svg>
  );
};

export default DishImage;
