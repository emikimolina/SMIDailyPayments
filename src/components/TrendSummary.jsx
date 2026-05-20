import { useState } from 'react';

function fmtMoney(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtWeek(dateStr) {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.split('-');
    return `${m}/${d}/${y.slice(2)}`;
  } catch { return dateStr; }
}

function TrendPill({ direction, pctChange }) {
  if (pctChange === null) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F6F9FC] text-[#697386]">— new</span>;
  }
  if (direction === 'up') {
    return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#09825D]">↑ {Math.abs(pctChange).toFixed(1)}%</span>;
  }
  if (direction === 'down') {
    return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1F2] text-[#C0123C]">↓ {Math.abs(pctChange).toFixed(1)}%</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F6F9FC] text-[#697386]">→ flat</span>;
}

function PeriodCells({ d }) {
  return (
    <>
      <td className="px-3 py-2.5 text-right font-mono text-xs text-[#697386]">{fmtMoney(d.ins)}</td>
      <td className="px-3 py-2.5 text-right font-mono text-xs text-[#697386]">{fmtMoney(d.pat)}</td>
      <td className="px-3 py-2.5 text-right font-mono text-xs text-[#C0123C]">{d.ref > 0 ? `(${fmtMoney(d.ref)})` : '—'}</td>
      <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-[#1A1F36]">{fmtMoney(d.net)}</td>
    </>
  );
}

function PlanRow({ plan }) {
  return (
    <tr className="hover:bg-[#FAFBFD] transition-colors border-t border-[#F6F9FC]">
      <td className="pl-10 pr-3 py-2 text-xs text-[#697386] italic">{plan.planName}</td>
      <PeriodCells d={plan.prior} />
      <PeriodCells d={plan.current} />
      <td className="px-3 py-2 text-right">
        <TrendPill direction={plan.direction} pctChange={plan.netPctChange} />
      </td>
    </tr>
  );
}

function CoRow({ row, expanded, onToggle }) {
  return (
    <tr
      className="hover:bg-[#F6F9FC] transition-colors cursor-pointer"
      onClick={onToggle}
    >
      <td className="px-5 py-3 font-semibold text-[#1A1F36] text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="text-[#697386] text-xs w-3">{expanded ? '▾' : '▸'}</span>
          {row.insCoName}
          <span className="text-[#697386] text-xs font-normal">({row.plans.length})</span>
        </span>
      </td>
      <PeriodCells d={row.prior} />
      <PeriodCells d={row.current} />
      <td className="px-3 py-2 text-right">
        <TrendPill direction={row.direction} pctChange={row.netPctChange} />
      </td>
    </tr>
  );
}

const SUBHEADERS = ['Ins Pmt', 'Pat Pmt', 'Refunds', 'Net'];

export default function TrendSummary({ data }) {
  const [expanded, setExpanded] = useState({});

  if (!data?.data?.length) return null;

  const { currentWeek, priorWeek, data: rows } = data;
  const up   = rows.filter(d => d.direction === 'up');
  const down = rows.filter(d => d.direction === 'down');
  const flat = rows.filter(d => d.direction === 'flat');

  function toggle(name) {
    setExpanded(e => ({ ...e, [name]: !e[name] }));
  }

  return (
    <div className="bg-white rounded-xl border border-[#E3E8EE] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F0F4F8] flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#697386] uppercase tracking-wider mb-0.5">Payer Trends</p>
          <p className="text-sm font-semibold text-[#1A1F36]">
            Week-over-Week &mdash; {fmtWeek(priorWeek)} → {fmtWeek(currentWeek)}
          </p>
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
            {/* Group row */}
            <tr className="bg-[#F6F9FC] border-b border-[#E3E8EE]">
              <th className="px-5 py-2 text-left text-xs font-semibold text-[#697386] uppercase tracking-wider" rowSpan={2}>
                Payer / Plan
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-[#697386] uppercase tracking-wider border-l border-[#E3E8EE]" colSpan={4}>
                Prior Week ({fmtWeek(priorWeek)})
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-[#697386] uppercase tracking-wider border-l border-[#E3E8EE]" colSpan={4}>
                Current Week ({fmtWeek(currentWeek)})
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-[#697386] uppercase tracking-wider border-l border-[#E3E8EE]" rowSpan={2}>
                WoW
              </th>
            </tr>
            {/* Sub-headers */}
            <tr className="bg-[#F6F9FC] border-b border-[#E3E8EE]">
              {SUBHEADERS.map(h => (
                <th key={`p-${h}`} className="px-3 py-1.5 text-right text-xs font-medium text-[#697386] whitespace-nowrap">{h}</th>
              ))}
              {SUBHEADERS.map(h => (
                <th key={`c-${h}`} className="px-3 py-1.5 text-right text-xs font-medium text-[#697386] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F4F8]">
            {rows.map(row => (
              <>
                <CoRow
                  key={row.insCoName}
                  row={row}
                  expanded={!!expanded[row.insCoName]}
                  onToggle={() => toggle(row.insCoName)}
                />
                {expanded[row.insCoName] && row.plans.map(plan => (
                  <PlanRow key={`${row.insCoName}|${plan.planName}`} plan={plan} />
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
