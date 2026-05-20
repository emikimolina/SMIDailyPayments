import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function fmtMoney(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-white border border-[#E3E8EE] rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#1A1F36] mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-[#3C4257]">{p.name}</span>
          <span className="font-mono font-semibold text-[#1A1F36] ml-auto pl-2">{fmtMoney(p.value)}</span>
          <span className="text-[#697386]">({total > 0 ? ((p.value / total) * 100).toFixed(0) : 0}%)</span>
        </div>
      ))}
    </div>
  );
}

export default function StateComparisonChart({ data }) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-[#E3E8EE] shadow-sm p-5">
        <p className="text-xs font-semibold text-[#697386] uppercase tracking-wider mb-0.5">State Mix</p>
        <p className="text-sm font-semibold text-[#1A1F36] mb-4">Insurance vs Patient by State</p>
        <div className="h-64 flex items-center justify-center text-[#697386] text-sm">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E3E8EE] shadow-sm p-5">
      <p className="text-xs font-semibold text-[#697386] uppercase tracking-wider mb-0.5">State Mix</p>
      <p className="text-sm font-semibold text-[#1A1F36] mb-4">Insurance vs Patient by State</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false} />
          <XAxis
            dataKey="state"
            tick={{ fontSize: 11, fill: '#697386' }}
            tickLine={false}
            axisLine={{ stroke: '#E3E8EE' }}
          />
          <YAxis
            tickFormatter={fmtMoney}
            tick={{ fontSize: 11, fill: '#697386' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#697386' }} iconType="circle" iconSize={8} />
          <Bar dataKey="insurancePayment" name="Insurance" fill="#5469D4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="patientPayment"   name="Patient"   fill="#7C3AED" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
