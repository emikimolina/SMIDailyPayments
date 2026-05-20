import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = [
  '#5469D4', '#09825D', '#C0123C', '#D97706', '#7C3AED',
  '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#6366F1',
];

function fmtMoney(v) {
  if (v === undefined || v === null) return '';
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtWeek(dateStr) {
  try { return format(parseISO(dateStr), 'MMM d'); } catch { return dateStr; }
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-white border border-[#E3E8EE] rounded-xl shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-semibold text-[#1A1F36] mb-2">Week ending {fmtWeek(label)}</p>
      <p className="text-[#697386] mb-2 font-medium">Total: {fmtMoney(total)}</p>
      {[...payload].sort((a, b) => b.value - a.value).map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-[#3C4257] flex-1 truncate max-w-[120px]">{p.dataKey}</span>
          <span className="font-mono text-[#1A1F36] font-semibold">{fmtMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CustomTick({ x, y, payload, index }) {
  if (index % 4 !== 0) return null;
  return (
    <text x={x} y={y + 12} textAnchor="middle" fill="#697386" fontSize={11}>
      {fmtWeek(payload.value)}
    </text>
  );
}

export default function WeeklyTrendChart({ data, groupings }) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-[#E3E8EE] shadow-sm p-5 flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold text-[#697386] uppercase tracking-wider mb-0.5">Weekly Payment Trend</p>
          <p className="text-sm text-[#1A1F36] font-semibold">Net Collected by Posting Week</p>
        </div>
        <div className="h-64 flex items-center justify-center text-[#697386] text-sm">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E3E8EE] shadow-sm p-5 flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-[#697386] uppercase tracking-wider mb-0.5">Weekly Payment Trend</p>
        <p className="text-sm text-[#1A1F36] font-semibold">Net Collected by Posting Week — Top {groupings.length} Payers</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false} />
          <XAxis
            dataKey="week"
            tick={<CustomTick />}
            tickLine={false}
            axisLine={{ stroke: '#E3E8EE' }}
            height={30}
          />
          <YAxis
            tickFormatter={fmtMoney}
            tick={{ fontSize: 11, fill: '#697386' }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#697386', paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          {groupings.map((g, i) => (
            <Area
              key={g}
              type="monotone"
              dataKey={g}
              stackId="1"
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.55}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
