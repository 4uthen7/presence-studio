function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

function svgData(svg: string): string {
  const bytes = new TextEncoder().encode(svg)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:image/svg+xml;base64,${btoa(binary)}`
}

function initials(name: string): string {
  const clean = name.trim()
  if (!clean) return 'PS'
  const parts = clean.split(/\s+/)
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
  return clean.slice(0, 2).toUpperCase()
}

export function makeAvatar(name: string, accent: string, secondary: string): string {
  const h = hashString(name)
  const rotation = h % 60
  const text = initials(name)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${accent}"/>
<stop offset="0.58" stop-color="${secondary}"/>
<stop offset="1" stop-color="#11131c"/>
</linearGradient>
<radialGradient id="r" cx="0.22" cy="0.12" r="0.9">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="256" height="256" fill="url(#g)"/>
<rect width="256" height="256" fill="url(#r)"/>
<g transform="rotate(${rotation} 128 128)" opacity="0.2">
<circle cx="128" cy="128" r="86" fill="none" stroke="#ffffff" stroke-width="1.5"/>
<circle cx="128" cy="128" r="112" fill="none" stroke="#ffffff" stroke-width="1"/>
<path d="M-20 180 Q 80 88 276 128" fill="none" stroke="#ffffff" stroke-width="1.5"/>
</g>
<text x="128" y="150" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="88" font-weight="650" fill="#ffffff" opacity="0.94" letter-spacing="-4">${text}</text>
</svg>`
  return svgData(svg)
}

export function makeBanner(seed: string, accent: string, secondary: string): string {
  const h = hashString(seed)
  const c1 = h % 200
  const c2 = (h >> 3) % 260
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
<defs>
<linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#0b0d15"/>
<stop offset="0.45" stop-color="${accent}" stop-opacity="0.72"/>
<stop offset="1" stop-color="${secondary}" stop-opacity="0.7"/>
</linearGradient>
<radialGradient id="glow" cx="0.75" cy="0.2" r="0.8">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.34"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="34"/></filter>
</defs>
<rect width="1200" height="400" fill="url(#b)"/>
<rect width="1200" height="400" fill="url(#glow)"/>
<circle cx="${220 + c1}" cy="${120 + c2 * 0.4}" r="190" fill="${accent}" opacity="0.3" filter="url(#blur)"/>
<circle cx="${980 - c2 * 0.5}" cy="${330 - c1 * 0.3}" r="150" fill="${secondary}" opacity="0.24" filter="url(#blur)"/>
<g stroke="#ffffff" stroke-opacity="0.1" stroke-width="1">
<path d="M-100 ${300 + c1 * 0.2} L 1300 ${60 + c2 * 0.2}"/>
<path d="M-100 ${360 + c1 * 0.2} L 1300 ${120 + c2 * 0.2}"/>
<path d="M-100 ${420 + c1 * 0.2} L 1300 ${180 + c2 * 0.2}"/>
</g>
<g fill="none" stroke="#ffffff" stroke-opacity="0.16">
<circle cx="${900 - c1}" cy="${80 + c2 * 0.3}" r="110"/>
<circle cx="${900 - c1}" cy="${80 + c2 * 0.3}" r="150"/>
</g>
</svg>`
  return svgData(svg)
}

export function makeArtwork(seed: string, accent: string, secondary: string): string {
  const h = hashString(seed)
  const letter = (seed.match(/[a-zA-Z0-9]/)?.[0] ?? 'P').toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
<defs>
<linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#090b12"/>
<stop offset="0.4" stop-color="${accent}" stop-opacity="0.8"/>
<stop offset="1" stop-color="${secondary}" stop-opacity="0.75"/>
</linearGradient>
<radialGradient id="s" cx="0.68" cy="0.22" r="0.72">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.48"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
<radialGradient id="v" cx="0.2" cy="0.7" r="0.85">
<stop offset="0" stop-color="#05060a" stop-opacity="0.5"/>
<stop offset="1" stop-color="#05060a" stop-opacity="0"/>
</radialGradient>
<filter id="soft"><feGaussianBlur stdDeviation="50"/></filter>
</defs>
<rect width="1200" height="675" fill="url(#a)"/>
<circle cx="${380 + (h % 240)}" cy="${220 + (h % 120)}" r="240" fill="${secondary}" opacity="0.42" filter="url(#soft)"/>
<circle cx="${980 - (h % 180)}" cy="${560 - (h % 90)}" r="280" fill="${accent}" opacity="0.36" filter="url(#soft)"/>
<rect width="1200" height="675" fill="url(#s)"/>
<rect width="1200" height="675" fill="url(#v)"/>
<text x="1060" y="590" text-anchor="end" font-family="Segoe UI, Arial, sans-serif" font-size="520" font-weight="700" letter-spacing="-26" fill="#ffffff" opacity="0.055">${letter}</text>
<g opacity="0.24" fill="none" stroke="#ffffff" stroke-width="1.2">
<circle cx="${930 - (h % 160)}" cy="150" r="170"/>
<circle cx="${930 - (h % 160)}" cy="150" r="230"/>
<circle cx="${930 - (h % 160)}" cy="150" r="290"/>
<circle cx="${930 - (h % 160)}" cy="150" r="12" fill="#ffffff" stroke="none" opacity="0.6"/>
</g>
<g opacity="0.2" stroke="#ffffff" stroke-width="1">
<path d="M0 610 L1200 420"/>
<path d="M0 660 L1200 470"/>
<path d="M0 710 L1200 520"/>
</g>
<rect y="470" width="1200" height="205" fill="#06070b" opacity="0.38"/>
</svg>`
  return svgData(svg)
}
