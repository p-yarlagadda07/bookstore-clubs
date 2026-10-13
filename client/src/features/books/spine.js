const SPINES = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--ink-orange)',
  'var(--ink-teal)',
];

// same title always gets the same spine colour
export function spineColor(title = '') {
  let n = 0;
  for (const ch of title) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return SPINES[n % SPINES.length];
}
