function fmtWeek(dateStr) {
  if (!dateStr) return dateStr;
  try {
    const [y, m, d] = dateStr.split('-');
    return `${m}/${d}/${y.slice(2)}`;
  } catch { return dateStr; }
}

function MultiSelect({ label, options, selected, onChange }) {
  function toggle(val) {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  }

  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-1 mt-0.5 max-h-20 overflow-y-auto">
        {options.map(o => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
              ${selected.includes(o)
                ? 'bg-[#5469D4] text-white border-[#5469D4]'
                : 'bg-white text-[#3C4257] border-[#E3E8EE] hover:border-[#5469D4]'}`}
          >
            {o}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs text-[#697386] hover:text-[#3C4257] text-left mt-0.5"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default function Filters({ options, filters, onChange }) {
  const months = options.months || [];
  const weeks  = options.postingWeeks || [];

  return (
    <div className="bg-white border border-[#E3E8EE] rounded-xl p-4 flex flex-wrap gap-6 items-start">
      <MultiSelect
        label="State"
        options={options.states || []}
        selected={filters.states}
        onChange={v => onChange({ ...filters, states: v })}
      />
      <MultiSelect
        label="Insurance Grouping"
        options={options.insuranceGroupings || []}
        selected={filters.insuranceGroupings}
        onChange={v => onChange({ ...filters, insuranceGroupings: v })}
      />
      <MultiSelect
        label="CPT Modality"
        options={options.cptModalities || []}
        selected={filters.cptModalities}
        onChange={v => onChange({ ...filters, cptModalities: v })}
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#697386] uppercase tracking-wide">Month of Service</label>
        <div className="flex items-center gap-2">
          <select
            className="border border-[#E3E8EE] rounded-lg px-2 py-1.5 text-sm text-[#3C4257] bg-white outline-none focus:ring-2 focus:ring-[#5469D4]/30"
            value={filters.dateFrom || ''}
            onChange={e => onChange({ ...filters, dateFrom: e.target.value || null })}
          >
            <option value="">All start</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="text-[#697386] text-sm">—</span>
          <select
            className="border border-[#E3E8EE] rounded-lg px-2 py-1.5 text-sm text-[#3C4257] bg-white outline-none focus:ring-2 focus:ring-[#5469D4]/30"
            value={filters.dateTo || ''}
            onChange={e => onChange({ ...filters, dateTo: e.target.value || null })}
          >
            <option value="">All end</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#697386] uppercase tracking-wide">Posting Period</label>
        <div className="flex items-center gap-2">
          <select
            className="border border-[#E3E8EE] rounded-lg px-2 py-1.5 text-sm text-[#3C4257] bg-white outline-none focus:ring-2 focus:ring-[#5469D4]/30"
            value={filters.postingWeekFrom || ''}
            onChange={e => onChange({ ...filters, postingWeekFrom: e.target.value || null })}
          >
            <option value="">All start</option>
            {weeks.map(w => <option key={w} value={w}>{fmtWeek(w)}</option>)}
          </select>
          <span className="text-[#697386] text-sm">—</span>
          <select
            className="border border-[#E3E8EE] rounded-lg px-2 py-1.5 text-sm text-[#3C4257] bg-white outline-none focus:ring-2 focus:ring-[#5469D4]/30"
            value={filters.postingWeekTo || ''}
            onChange={e => onChange({ ...filters, postingWeekTo: e.target.value || null })}
          >
            <option value="">All end</option>
            {weeks.map(w => <option key={w} value={w}>{fmtWeek(w)}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-end ml-auto">
        <button
          type="button"
          onClick={() => onChange({
            states: [], insuranceGroupings: [], cptModalities: [],
            dateFrom: null, dateTo: null,
            postingWeekFrom: null, postingWeekTo: null,
          })}
          className="px-3 py-1.5 text-sm text-[#697386] hover:text-[#3C4257] border border-[#E3E8EE] rounded-lg hover:bg-[#F6F9FC] transition-colors"
        >
          Reset all
        </button>
      </div>
    </div>
  );
}
