import { useState, useMemo, useCallback } from 'react';
import FileUpload from './components/FileUpload.jsx';
import Filters from './components/Filters.jsx';
import KPICards from './components/KPICards.jsx';
import PayerScorecard from './components/PayerScorecard.jsx';
import WeeklyTrendChart from './components/WeeklyTrendChart.jsx';
import StateComparisonChart from './components/StateComparisonChart.jsx';
import TrendSummary from './components/TrendSummary.jsx';
import ColumnMapper from './components/ColumnMapper.jsx';
import {
  extractHeaders,
  detectColumnMap,
  parseCSV,
  getFilterOptions,
  applyFilters,
  computeKPIs,
  computeKPITrends,
  computePayerScorecard,
  computeWeeklyTrend,
  computeTrendSummary,
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
      if (parsed.length === 0) {
        setError('File parsed but returned 0 rows. Open F12 → Console to inspect the column mapping.');
        return;
      }
      setRows(parsed);
      setFilters(DEFAULT_FILTERS);
      setStage('dashboard');
    } catch (e) {
      setError(`Failed to parse file — ${e?.message ?? String(e)}`);
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

  const filterOptions  = useMemo(() => rows ? getFilterOptions(rows) : null, [rows]);
  const filtered       = useMemo(() => rows ? applyFilters(rows, filters) : [], [rows, filters]);
  const kpis           = useMemo(() => computeKPIs(filtered), [filtered]);
  const kpiTrends      = useMemo(() => computeKPITrends(filtered), [filtered]);
  const scorecard      = useMemo(() => computePayerScorecard(filtered), [filtered]);
  const weeklyTrend    = useMemo(() => computeWeeklyTrend(filtered), [filtered]);
  const trendSummary   = useMemo(() => computeTrendSummary(filtered), [filtered]);
  const stateData      = useMemo(() => computeStateComparison(filtered), [filtered]);

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      {/* Header */}
      <header className="bg-white border-b border-[#E3E8EE] sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#5469D4] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">SMI</span>
            </div>
            <p className="text-sm font-semibold text-[#1A1F36]">Payer Performance Dashboard</p>
          </div>

          {stage !== 'upload' && (
            <div className="flex items-center gap-2">
              {stage === 'dashboard' && (
                <button
                  onClick={() => setStage('mapping')}
                  className="text-xs text-[#697386] hover:text-[#3C4257] border border-[#E3E8EE] rounded-lg px-3 py-1.5 hover:bg-[#F6F9FC] transition-colors"
                >
                  Re-map columns
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-[#697386] bg-[#F6F9FC] border border-[#E3E8EE] rounded-lg px-3 py-1.5">
                <svg className="w-3.5 h-3.5 text-[#09825D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {pendingFile?.name}
                <button onClick={handleReset} className="ml-1 text-[#697386] hover:text-[#1A1F36]">✕</button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Upload */}
        {stage === 'upload' && (
          <div className="max-w-lg mx-auto w-full mt-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#1A1F36] mb-2">Upload Payment Data</h2>
              <p className="text-sm text-[#697386]">
                Drop your practice management export below. You'll map column names on the next screen.
              </p>
            </div>
            <FileUpload onFileLoaded={handleFileLoaded} loading={loading} />
            {error && (
              <div className="mt-4 p-3 bg-[#FFF1F2] border border-[#FFC9D2] rounded-lg text-sm text-[#C0123C]">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Column mapping */}
        {stage === 'mapping' && (
          <>
            {loading && (
              <div className="max-w-2xl mx-auto w-full p-4 bg-[#EEF2FF] border border-[#C7D7FD] rounded-xl text-sm text-[#5469D4] text-center font-medium">
                Parsing file — this may take a minute for large files. Please wait…
              </div>
            )}
            {error && (
              <div className="max-w-2xl mx-auto w-full p-3 bg-[#FFF1F2] border border-[#FFC9D2] rounded-xl text-sm text-[#C0123C]">
                {error}
              </div>
            )}
            {!loading && (
              <ColumnMapper
                fileName={pendingFile?.name}
                headers={fileHeaders}
                columnMap={columnMap}
                onChange={setColumnMap}
                onConfirm={handleConfirmMapping}
                onBack={handleReset}
              />
            )}
          </>
        )}

        {/* Dashboard */}
        {stage === 'dashboard' && (
          <>
            <Filters options={filterOptions} filters={filters} onChange={setFilters} />

            <KPICards kpis={kpis} trends={kpiTrends} rowCount={filtered.length} />

            <WeeklyTrendChart data={weeklyTrend.chartData} groupings={weeklyTrend.groupings} />

            <TrendSummary data={trendSummary} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StateComparisonChart data={stateData} />
              <PayerScorecard data={scorecard} />
            </div>

            <p className="text-xs text-[#697386] text-center pb-4">
              {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} records shown
              {' · '}Net Collected = Insurance + Patient − Refunds
              {' · '}Trend compares recent vs prior equal periods
            </p>
          </>
        )}

      </main>
    </div>
  );
}
