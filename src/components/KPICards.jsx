function fmt(n, style, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    style, currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function TrendBadge({ value, isPointChange = false, invert = false }) {
  if (value === null || value === undefined) return null;
  const abs = Math.abs(value);
  if (abs < 0.05) return <span className="text-xs text-[#697386]">— flat</span>;

  const positive = invert ? value < 0 : value > 0;
  const colorCls = positive
    ? 'text-[#09825D] bg-[#ECFDF5]'
    : 'text-[#C0123C] bg-[#FFF1F2]';
  const arrow = positive ? '↑' : '↓';
  const label = isPointChange
    ? `${arrow} ${abs.toFixed(1)} pp`
    : `${arrow} ${abs.toFixed(1)}%`;

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full ${colorCls}`}>
      {label}
    </span>
  );
}

function Card({ title, value, sub, trend, isPointChange, invert }) {
  return (
    <div className="bg-white rounded-xl border border-[#E3E8EE] p-5 flex flex-col gap-2 shadow-sm">
      <p className="text-xs font-semibold text-[#697386] uppercase tracking-wider">{title}</p>
      <p className="text-[1.6rem] font-bold text-[#1A1F36] leading-none tracking-tight">{value}</p>
      <div className="flex items-center gap-2 min-h-[20px]">
        {sub && <span className="text-xs text-[#697386]">{sub}</span>}
        <TrendBadge value={trend} isPointChange={isPointChange} invert={invert} />
      </div>
    </div>
  );
}

export default function KPICards({ kpis, trends, weekLabel }) {
  const { totalCollected, insurancePct, patientPct, refundRate, avgDaysToPost } = kpis;
  const t = trends || {};
  const weekSub = weekLabel ? `Week of ${weekLabel}` : 'Last complete week';
  const wowSub  = weekLabel ? `vs prior week` : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card
        title="Net Collected"
        value={fmt(totalCollected, 'currency')}
        sub={weekSub}
        trend={t.totalCollected}
      />
      <Card
        title="Insurance Mix"
        value={`${insurancePct.toFixed(1)}%`}
        sub={wowSub}
        trend={t.insurancePct}
        isPointChange
      />
      <Card
        title="Patient Mix"
        value={`${patientPct.toFixed(1)}%`}
        sub={wowSub}
        trend={t.patientPct}
        isPointChange
      />
      <Card
        title="Refund Rate"
        value={`${refundRate.toFixed(2)}%`}
        sub={wowSub}
        trend={t.refundRate}
        isPointChange
        invert
      />
      <Card
        title="Avg Days to Post"
        value={avgDaysToPost ? `${avgDaysToPost.toFixed(1)}d` : '—'}
        sub={wowSub}
        trend={t.avgDaysToPost}
        invert
      />
    </div>
  );
}
