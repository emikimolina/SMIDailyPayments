import { useState } from 'react';

function fmt(n, style, digits = 0) {
  return new Intl.NumberFormat('en-US', { style, currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

const COLS = [
  { key: 'rank', label: '#', align: 'center', sortable: false },
  { key: 'insuranceGrouping', label: 'Payer', align: 'left', sortable: true },
  { key: 'claimCount', label: 'Claims', align: 'right', sortable: true },
  { key: 'insurancePayment', label: 'Insurance Payment', align: 'right', sortable: true },
  { key: 'patientPayment', label: 'Patient Payment', align: 'right', sortable: true },
  { key: 'netCollected', label: 'Net Collected', align: 'right', sortable: true },
  { key: 'refundRate', label: 'Refund Rate', align: 'right', sortable: true },
  { key: 'avgDaysToPost', label: 'Avg Days to Post', align: 'right', sortable: true },
];

function SortIcon({ dir }) {
  if (!dir) return <span className="ml-1 text-slate-300">↕</span>;
  return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function PayerScorecard({ data }) {
  const [sortKey, setSortKey] = useState('insurancePayment');
  const [sortDir, setSortDir] = useState('desc');

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  function cellVal(row, key, rank) {
    if (key === 'rank') return rank;
    if (key === 'insuranceGrouping') return row.insuranceGrouping;
    if (key === 'claimCount') return row.claimCount.toLocaleString();
    if (key === 'insurancePayment') return fmt(row.insurancePayment, 'currency');
    if (key === 'patientPayment') return fmt(row.patientPayment, 'currency');
    if (key === 'netCollected') return fmt(row.netCollected, 'currency');
    if (key === 'refundRate') return `${row.refundRate.toFixed(2)}%`;
    if (key === 'avgDaysToPost') return row.avgDaysToPost !== null ? row.avgDaysToPost.toFixed(1) : '—';
    return '';
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Payer Scorecard</h2>
        <span className="text-xs text-slate-400">{data.length} payers</span>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {COLS.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${col.sortable ? 'cursor-pointer hover:text-slate-700 select-none' : ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && <SortIcon dir={sortKey === col.key ? sortDir : null} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((row, i) => (
              <tr key={row.insuranceGrouping} className="hover:bg-slate-50 transition-colors">
                {COLS.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-slate-700 whitespace-nowrap
                      ${col.align === 'right' ? 'text-right font-mono text-xs' : col.align === 'center' ? 'text-center text-slate-400 text-xs' : ''}
                      ${col.key === 'insuranceGrouping' ? 'font-medium text-slate-800' : ''}
                      ${col.key === 'refundRate' && row.refundRate > 5 ? 'text-rose-600 font-semibold' : ''}
                      ${col.key === 'avgDaysToPost' && row.avgDaysToPost !== null && row.avgDaysToPost > 30 ? 'text-amber-600' : ''}`}
                  >
                    {cellVal(row, col.key, i + 1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">No data for current filters</div>
        )}
      </div>
    </div>
  );
}
