import { useState, useMemo, useCallback } from 'react';
import FileUpload from './components/FileUpload.jsx';
import Filters from './components/Filters.jsx';
import KPICards from './components/KPICards.jsx';
import PayerScorecard from './components/PayerScorecard.jsx';
import MonthlyTrendChart from './components/MonthlyTrendChart.jsx';
import StateComparisonChart from './components/StateComparisonChart.jsx';
import ColumnMapper from './components/ColumnMapper.jsx';
import {
  extractHeaders,
  detectColumnMap,
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

// stage: 'upload' | 'mapping' | 'dashboard'
export default function App() {
  const [stage, setStage] = useState('upload');
  const [pendingFile, setPendingFile] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const handleFileLoaded = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await extractHeaders(file);
      if (!headers.length) throw new Error('No headers found');
      setPendingFile(file);
      setFileHeaders(headers);
      setColumnMap(detectColumnMap(headers));
      setStage('mapping');
    } catch (e) {
      setError(`Could not read file headers — ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirmMapping = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseCSV(pendingFile, columnMap);
      setRows(parsed);
      setFilters(DEFAULT_FILTERS);
      setStage('dashboard');
    } catch {
      setError('Failed to parse file with the selected column mapping.');
    } finally {
      setLoading(false);
    }
  }, [pendingFile, columnMap]);

  const handleReset = useCallback(() => {
    setStage('upload');
    setPendingFile(null);
    setFileHeaders([]);
    setColumnMap({});
    setRows(null);
    setFilters(DEFAULT_FILTERS);
    setError(null);
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

          {stage !== 'upload' && (
            <div className="flex items-center gap-2">
              {stage === 'dashboard' && (
                <button
                  onClick={() => setStage('mapping')}
                  className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
                >
                  Re-map columns
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {pendingFile?.name}
                <button onClick={handleReset} className="ml-1 text-slate-400 hover:text-slate-600">✕</button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 flex flex-col gap-6">

        {/* Upload stage */}
        {stage === 'upload' && (
          <div className="max-w-lg mx-auto w-full mt-16">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Upload Payment Data</h2>
              <p className="text-sm text-slate-500">
                Export your practice management file and drop it below. You'll map your column names next.
              </p>
            </div>
            <FileUpload onFileLoaded={handleFileLoaded} loading={loading} />
            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Column mapping stage */}
        {stage === 'mapping' && (
          <>
            {error && (
              <div className="max-w-2xl mx-auto w-full p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                {error}
              </div>
            )}
            <ColumnMapper
              fileName={pendingFile?.name}
              headers={fileHeaders}
              columnMap={columnMap}
              onChange={setColumnMap}
              onConfirm={handleConfirmMapping}
              onBack={handleReset}
            />
          </>
        )}

        {/* Dashboard stage */}
        {stage === 'dashboard' && (
          <>
            <Filters options={filterOptions} filters={filters} onChange={setFilters} />
            <KPICards kpis={kpis} rowCount={filtered.length} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlyTrendChart data={trend.chartData} groupings={trend.groupings} />
              <StateComparisonChart data={stateData} />
            </div>
            <PayerScorecard data={scorecard} />
            <p className="text-xs text-slate-400 text-center pb-2">
              Showing {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} claims
              {' · '}Net Collected = Insurance + Patient − Refunds
              {' · '}Days to Post = Posted Date − Last Day of Month of Service
            </p>
          </>
        )}

      </main>
    </div>
  );
}
