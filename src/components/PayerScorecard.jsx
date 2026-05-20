import { useState, Fragment } from 'react';

function fmt(n, style, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    style, currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

const COLS = [
  { key: 'insuranceGrouping', label: 'Payer',           align: 'left',   sortable: true  },
  { key: 'claimCount',        label: 'Records',          align: 'right',  sortable: true  },
  { key: 'insurancePayment',  label: 'Insurance Pmt',    align: 'right',  sortable: true  },
  { key: 'patientPayment',    label: 'Patient Pmt',      align: 'right',  sortable: true  },
  { key: 'netCollected',      label: 'Net Collected',    align: 'right',  sortable: true  },
  { key: 'refundRate',        label: 'Refund Rate',      align: 'right',  sortable: true  },
  { key: 'avgDaysToPost',     label: 'Avg Days to Post', align: 'right',  sortable: true  },
];

function SortIcon({ active, dir }) {
  if (!active) return <span className="ml-1 text-[#C8D0DC]">↕</span>;
  return <span className="ml-1 text-[#5469D4]">{dir === 'asc' ? '↑' : '↓'}</span>;
}

function parentCell(row, key, rank, isExpanded) {
  if (key === 'insuranceGrouping') return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[#697386] text-xs">{isExpanded ? '▾' : '▸'}</span>
      <span className="text-[#697386] text-xs">#{rank}</span>
      {row.insuranceGrouping}
      <span className="text-[#697386] text-xs font-normal">({row.plans.length})</span>
    </span>
  );
  if (key === 'claimCount')       return row.claimCount.toLocaleString();
  if (key === 'insurancePayment') return fmt(row.insurancePayment, 'currency');
  if (key === 'patientPayment')   return fmt(row.patientPayment, 'currency');
  if (key === 'netCollected')     return fmt(row.netCollected, 'currency');
  if (key === 'refundRate')       return `${row.refundRate.toFixed(2)}%`;
  if (key === 'avgDaysToPost')    return row.avgDaysToPost != null ? `${row.avgDaysToPost.toFixed(1)}d` : '—';
  return '';
}

function planCell(plan, key) {
  if (key === 'insuranceGrouping') return plan.insurancePlanName;
  if (key === 'claimCount')        return plan.claimCount.toLocaleString();
  if (key === 'insurancePayment')  return fmt(plan.insurancePayment, 'currency');
  if (key === 'patientPayment')    return fmt(plan.patientPayment, 'currency');
  if (key === 'netCollected')      return fmt(plan.netCollected, 'currency');
  if (key === 'refundRate')        return `${plan.refundRate.toFixed(2)}%`;
  if (key === 'avgDaysToPost')     return plan.avgDaysToPost != null ? `${plan.avgDaysToPost.toFixed(1)}d` : '—';
  return '';
}

export default function PayerScorecard({ data }) {
  const [sortKey, setSortKey] = useState('netCollected');
  const [sortDir, setSortDir] = useState('desc');
  const [expanded, setExpanded] = useState({});

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function toggleExpand(name) {
    setExpanded(e => ({ ...e, [name]: !e[name] }));
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  return (
    <div className="bg-white rounded-xl border border-[#E3E8EE] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0F4F8]">
        <p className="text-xs font-semibold text-[#697386] uppercase tracking-wider mb-0.5">Payer Scorecard</p>
        <p className="text-sm font-semibold text-[#1A1F36]">{data.length} payers ranked</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F6F9FC] border-b border-[#E3E8EE]">
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`px-4 py-3 text-xs font-semibold text-[#697386] uppercase tracking-wider whitespace-nowrap
                    ${col.align === 'right' ? 'text-right' : 'text-left'}
                    ${col.sortable ? 'cursor-pointer hover:text-[#3C4257] select-none' : ''}`}
                >
                  {col.label}
                  {col.sortable && <SortIcon active={sortKey === col.key} dir={sortDir} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F4F8]">
            {sorted.map((row, i) => (
              <Fragment key={row.insuranceGrouping}>
                <tr
                  className="hover:bg-[#F6F9FC] transition-colors cursor-pointer"
                  onClick={() => toggleExpand(row.insuranceGrouping)}
                >
                  {COLS.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 whitespace-nowrap
                        ${col.align === 'right' ? 'text-right font-mono text-xs text-[#3C4257]' : ''}
                        ${col.key === 'insuranceGrouping' ? 'font-semibold text-[#1A1F36]' : ''}
                        ${col.key === 'refundRate'    && row.refundRate    > 5  ? 'text-[#C0123C] font-bold' : ''}
                        ${col.key === 'avgDaysToPost' && row.avgDaysToPost > 30 ? 'text-[#D97706]'           : ''}`}
                    >
                      {parentCell(row, col.key, i + 1, !!expanded[row.insuranceGrouping])}
                    </td>
                  ))}
                </tr>
                {expanded[row.insuranceGrouping] && row.plans.map(plan => (
                  <tr
                    key={`${row.insuranceGrouping}|${plan.insurancePlanName}`}
                    className="hover:bg-[#FAFBFD] transition-colors"
                  >
                    {COLS.map(col => (
                      <td
                        key={col.key}
                        className={`whitespace-nowrap
                          ${col.key === 'insuranceGrouping' ? 'pl-10 pr-4 py-2.5 text-xs text-[#697386] italic' : 'px-4 py-2.5'}
                          ${col.align === 'right' ? 'text-right font-mono text-xs text-[#697386]' : ''}
                          ${col.key === 'refundRate'    && plan.refundRate    > 5  ? 'text-[#C0123C] font-semibold' : ''}
                          ${col.key === 'avgDaysToPost' && plan.avgDaysToPost > 30 ? 'text-[#D97706]'               : ''}`}
                      >
                        {planCell(plan, col.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="py-12 text-center text-[#697386] text-sm">No data for current filters</div>
        )}
      </div>
    </div>
  );
}
