function fmtMoney(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function TrendPill({ direction, pctChange }) {
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#09825D]">
        ↑ {Math.abs(pctChange).toFixed(1)}%
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1F2] text-[#C0123C]">
        ↓ {Math.abs(pctChange).toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F6F9FC] text-[#697386]">
      → flat
    </span>
  );
}

function Bar({ pct }) {
  return (
    <div className="w-full h-1 bg-[#F0F4F8] rounded-full overflow-hidden">
      <div className="h-full bg-[#5469D4] rounded-full" style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
    </div>
  );
}

export default function TrendSummary({ data }) {
  if (!data.length) return null;

  const maxTotal = Math.max(...data.map(d => d.total));
  const up   = data.filter(d => d.direction === 'up');
  const down = data.filter(d => d.direction === 'down');
  const flat = data.filter(d => d.direction === 'flat');

  return (
    <div className="bg-white rounded-xl border border-[#E3E8EE] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0F4F8] flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#697386] uppercase tracking-wider mb-0.5">Payer Trends</p>
          <p className="text-sm font-semibold text-[#1A1F36]">Recent vs Prior Period — Net Collected</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-[#09825D] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#09825D]" /> {up.length} up
          </span>
          <span className="flex items-center gap-1 text-[#C0123C] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#C0123C]" /> {down.length} down
          </span>
          {flat.length > 0 && (
            <span className="flex items-center gap-1 text-[#697386]">
              <span className="w-2 h-2 rounded-full bg-[#697386]" /> {flat.length} flat
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F6F9FC] border-b border-[#E3E8EE]">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-[#697386] uppercase tracking-wider">Payer</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#697386] uppercase tracking-wider">Prior Period</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#697386] uppercase tracking-wider">Recent Period</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#697386] uppercase tracking-wider">Change</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-[#697386] uppercase tracking-wider w-32">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F4F8]">
            {data.map(row => (
              <tr key={row.grouping} className="hover:bg-[#F6F9FC] transition-colors">
                <td className="px-5 py-3 font-medium text-[#1A1F36]">{row.grouping}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[#697386]">{fmtMoney(row.prior)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[#3C4257] font-semibold">{fmtMoney(row.recent)}</td>
                <td className="px-4 py-3 text-right">
                  <TrendPill direction={row.direction} pctChange={row.pctChange} />
                </td>
                <td className="px-5 py-3">
                  <Bar pct={maxTotal > 0 ? (row.total / maxTotal) * 100 : 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
