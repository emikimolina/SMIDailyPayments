import { FIELD_DEFS } from '../utils/dataProcessing.js';

export default function ColumnMapper({ fileName, headers, columnMap, onChange, onConfirm, onBack }) {
  const requiredFields = FIELD_DEFS.filter(f => f.required);
  const allRequiredMapped = requiredFields.every(f => columnMap[f.key]);
  const mappedCount = FIELD_DEFS.filter(f => columnMap[f.key]).length;

  return (
    <div className="max-w-2xl mx-auto w-full mt-10">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Map Your Columns</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {fileName} &middot; {headers.length} columns detected &middot; {mappedCount} of {FIELD_DEFS.length} fields mapped
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            allRequiredMapped ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {allRequiredMapped ? 'Ready to load' : 'Required fields missing'}
          </span>
        </div>

        {/* Mapping rows */}
        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {FIELD_DEFS.map(field => {
            const value = columnMap[field.key] || '';
            const matched = !!value;

            return (
              <div key={field.key} className="px-6 py-3 flex items-center gap-4">
                <div className="w-44 flex-shrink-0">
                  <p className="text-sm font-medium text-slate-700">
                    {field.label}
                    {field.required && <span className="ml-1 text-rose-500 text-xs">*</span>}
                  </p>
                  {!field.required && (
                    <p className="text-xs text-slate-400">optional</p>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <select
                    value={value}
                    onChange={e => onChange({ ...columnMap, [field.key]: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-colors
                      ${matched
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : field.required
                          ? 'border-rose-200 bg-rose-50 text-slate-500'
                          : 'border-slate-200 bg-white text-slate-400'
                      }`}
                  >
                    <option value="">— not mapped —</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>

                  <div className="w-5 flex-shrink-0">
                    {matched && (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {!matched && field.required && (
                      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Upload different file
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allRequiredMapped}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors
              ${allRequiredMapped
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            Load Dashboard →
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center mt-3">
        <span className="text-rose-500">*</span> Required. Dropdowns are pre-filled using fuzzy matching — adjust any that look wrong.
      </p>
    </div>
  );
}
