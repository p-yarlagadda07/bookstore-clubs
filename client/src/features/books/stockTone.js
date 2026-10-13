export function stockTone(label) {
  if (label === 'Available') return 'success';
  if (label === 'Few left') return 'accent';
  return 'muted';
}
