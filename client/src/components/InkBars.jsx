// horizontal bars in our two inks; target draws a dashed line, e.g. this week's page
export default function InkBars({ items, max, target, unit = '' }) {
  const top = max ?? Math.max(1, ...items.map((item) => item.value), target?.value ?? 0);
  const pct = (v) => `${Math.min(100, (v / top) * 100)}%`;

  return (
    <div className="ink-bars">
      {items.map((item) => (
        <div className="ink-bar-row" key={item.label}>
          <span className="ink-bar-label">{item.label}</span>
          <span className="ink-bar-track">
            <span
              className={`ink-bar-fill ${item.tone ? `ink-bar-${item.tone}` : ''}`.trim()}
              style={{ width: pct(item.value) }}
            />
            {target && <span className="ink-bar-target" style={{ left: pct(target.value) }} />}
          </span>
          <span className="ink-bar-value">
            {item.value}
            {unit}
          </span>
        </div>
      ))}
      {target && <p className="ink-bars-key">Dashed line: {target.label}</p>}
    </div>
  );
}
