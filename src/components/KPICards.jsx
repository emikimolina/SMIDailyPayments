function fmt(n, style, digits = 0) {
  return new Intl.NumberFormat('en-US', { style, currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

function Card({ title, value, sub, color, icon }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600',
    rose: 'from-rose-500 to-rose-600',
    amber: 'from-amber-500 to-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white text-sm`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function KPICards({ kpis, rowCount }) {
  const { totalCollected, insurancePct, patientPct, refundRate, avgDaysToPost } = kpis;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card
        title="Total Net Collected"
        value={fmt(totalCollected, 'currency')}
        sub={`${rowCount.toLocaleString()} claims`}
        color="blue"
        icon="$"
      />
      <Card
        title="Insurance Mix"
        value={`${insurancePct.toFixed(1)}%`}
        sub="of total payments"
        color="emerald"
        icon="I"
      />
      <Card
        title="Patient Mix"
        value={`${patientPct.toFixed(1)}%`}
        sub="of total payments"
        color="violet"
        icon="P"
      />
      <Card
        title="Refund Rate"
        value={`${refundRate.toFixed(2)}%`}
        sub="refunds / total payment"
        color="rose"
        icon="R"
      />
      <Card
        title="Avg Days to Post"
        value={avgDaysToPost !== null ? `${avgDaysToPost.toFixed(1)}d` : '—'}
        sub="posted − month end"
        color="amber"
        icon="D"
      />
    </div>
  );
}
