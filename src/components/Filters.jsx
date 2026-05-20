function MultiSelect({ label, options, selected, onChange }) {
  function toggle(val) {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  }

  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <div className="border border-slate-200 rounded-lg bg-white max-h-9 overflow-hidden focus-within:ring-2 focus-within:ring-blue-300">
          <select
            multiple
            size={1}
            className="w-full px-3 py-1.5 text-sm text-slate-700 bg-transparent outline-none appearance-none cursor-pointer"
            value={selected}
            onChange={() => {}}
          >
            {options.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        {/* Custom dropdown display */}
        <div className="border border-slate-200 rounded-lg bg-white shadow-lg absolute top-full left-0 right-0 z-50 hidden group-focus:block" />
      </div>
      {/* Chip-based multiselect */}
      <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto">
        {options.map(o => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
              ${selected.includes(o)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
          >
            {o}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs text-slate-400 hover:text-slate-600 text-left mt-0.5"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default function Filters({ options, filters, onChange }) {
  const months = options.months || [];
  const dateFrom = filters.dateFrom || (months[0] ?? '');
  const dateTo = filters.dateTo || (months[months.length - 1] ?? '');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-6 items-start">
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
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date Range</label>
        <div className="flex items-center gap-2">
          <select
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-300"
            value={filters.dateFrom || ''}
            onChange={e => onChange({ ...filters, dateFrom: e.target.value || null })}
          >
            <option value="">All start</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="text-slate-400 text-sm">—</span>
          <select
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-300"
            value={filters.dateTo || ''}
            onChange={e => onChange({ ...filters, dateTo: e.target.value || null })}
          >
            <option value="">All end</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-end ml-auto">
        <button
          type="button"
          onClick={() => onChange({ states: [], insuranceGroupings: [], cptModalities: [], dateFrom: null, dateTo: null })}
          className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Reset all
        </button>
      </div>
    </div>
  );
}
