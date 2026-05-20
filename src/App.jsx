import { useState, useMemo, useCallback } from 'react';
import FileUpload from './components/FileUpload.jsx';
import Filters from './components/Filters.jsx';
import KPICards from './components/KPICards.jsx';
import PayerScorecard from './components/PayerScorecard.jsx';
import MonthlyTrendChart from './components/MonthlyTrendChart.jsx';
import StateComparisonChart from './components/StateComparisonChart.jsx';
import {
  parseCSV,
  getFilterOptions,
  applyFilters,
  computeKPIs,
  computePayerScorecard,
  computeMonthlyTrend,
  computeStateComparison,
} from './utils/dataProcessing.js';

const DEFAULT_FILTERS = {
  states: [],
  insuranceGroupings: [],
  cptModalities: [],
  dateFrom: null,
  dateTo: null,
};

export default function App() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [fileName, setFileName] = useState(null);

  const handleFileLoaded = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseCSV(file);
      setRows(parsed);
      setFileName(file.name);
      setFilters(DEFAULT_FILTERS);
    } catch (e) {
      setError('Failed to parse CSV. Check that the file matches the expected format.');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterOptions = useMemo(() => rows ? getFilterOptions(rows) : null, [rows]);
  const filtered = useMemo(() => rows ? applyFilters(rows, filters) : [], [rows, filters]);
  const kpis = useMemo(() => computeKPIs(filtered), [filtered]);
  const scorecard = useMemo(() => computePayerScorecard(filtered), [filtered]);
  const trend = useMemo(() => computeMonthlyTrend(filtered), [filtered]);
  const stateData = useMemo(() => computeStateComparison(filtered), [filtered]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">SMI</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">Payer Performance Dashboard</h1>
              <p className="text-xs text-slate-400">Radiology · AZ · FL · NV · CA · TX · NY</p>
            </div>
          </div>
          {fileName && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {fileName}
              <button
                onClick={() => { setRows(null); setFileName(null); setFilters(DEFAULT_FILTERS); }}
                className="ml-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Upload state */}
        {!rows && (
          <div className="max-w-lg mx-auto w-full mt-16">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Upload Payment Data</h2>
              <p className="text-sm text-slate-500">
                Export your practice management CSV and drop it below to generate the dashboard.
              </p>
            </div>
            <FileUpload onFileLoaded={handleFileLoaded} loading={loading} />
            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                {error}
              </div>
            )}
            <div className="mt-6 bg-slate-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Expected CSV columns</p>
              <div className="flex flex-wrap gap-1.5">
                {['CPT Code','Insurance Grouping','State','Insurance Plan Name','CPT Modality',
                  'Month of Service','Total Payment Amount','Insurance Payment','Patient Payment',
                  'Refunds','Payment Posted Date'].map(col => (
                  <span key={col} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-600 font-mono">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {rows && (
          <>
            {/* Filters */}
            <Filters
              options={filterOptions}
              filters={filters}
              onChange={setFilters}
            />

            {/* KPI Cards */}
            <KPICards kpis={kpis} rowCount={filtered.length} />

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlyTrendChart data={trend.chartData} groupings={trend.groupings} />
              <StateComparisonChart data={stateData} />
            </div>

            {/* Payer Scorecard */}
            <PayerScorecard data={scorecard} />

            <p className="text-xs text-slate-400 text-center pb-2">
              Showing {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} claims
              {' · '}Net Collected = Insurance Payment + Patient Payment − Refunds
              {' · '}Days to Post = Posted Date − Last Day of Month of Service
            </p>
          </>
        )}
      </main>
    </div>
  );
}
