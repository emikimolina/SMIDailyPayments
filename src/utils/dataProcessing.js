import Papa from 'papaparse';
import { parse, parseISO, isValid, endOfMonth, differenceInDays, format } from 'date-fns';

function parseMoney(val) {
  if (val === null || val === undefined || val === '') return 0;
  const str = String(val).trim().replace(/[$,\s]/g, '');
  if (str.startsWith('(') && str.endsWith(')')) return -(parseFloat(str.slice(1, -1)) || 0);
  return parseFloat(str) || 0;
}

function parseMonthOfService(val) {
  if (!val) return null;
  const str = String(val).trim();
  const fmts = ['yyyy-MM', 'MMMM yyyy', 'MMM yyyy', 'MM/yyyy', 'M/yyyy', 'yyyy/MM'];
  for (const fmt of fmts) {
    try {
      const d = parse(str, fmt, new Date());
      if (isValid(d)) return endOfMonth(d);
    } catch { /* try next */ }
  }
  return null;
}

function parsePostedDate(val) {
  if (!val) return null;
  const str = String(val).trim();
  try {
    const d = parseISO(str);
    if (isValid(d)) return d;
  } catch { /* fall through */ }
  const fmts = ['MM/dd/yyyy', 'M/d/yyyy', 'M/dd/yyyy', 'MM/d/yyyy', 'MM-dd-yyyy'];
  for (const fmt of fmts) {
    try {
      const d = parse(str, fmt, new Date());
      if (isValid(d)) return d;
    } catch { /* try next */ }
  }
  return null;
}

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = data.map(row => {
          const insurancePayment = parseMoney(row['Insurance Payment']);
          const patientPayment = parseMoney(row['Patient Payment']);
          const refunds = parseMoney(row['Refunds']);
          const totalPaymentAmount = parseMoney(row['Total Payment Amount']);
          const netCollected = insurancePayment + patientPayment - Math.abs(refunds);

          const monthEnd = parseMonthOfService(row['Month of Service']);
          const postedDate = parsePostedDate(row['Payment Posted Date']);

          let daysToPost = null;
          if (monthEnd && postedDate && isValid(monthEnd) && isValid(postedDate)) {
            daysToPost = differenceInDays(postedDate, monthEnd);
          }

          const refundRate = totalPaymentAmount !== 0
            ? (Math.abs(refunds) / Math.abs(totalPaymentAmount)) * 100
            : 0;

          let monthLabel = String(row['Month of Service'] || '').trim();
          if (monthEnd && isValid(monthEnd)) {
            monthLabel = format(monthEnd, 'yyyy-MM');
          }

          return {
            cptCode: String(row['CPT Code'] || '').trim(),
            insuranceGrouping: String(row['Insurance Grouping'] || '').trim(),
            state: String(row['State'] || '').trim(),
            insurancePlanName: String(row['Insurance Plan Name'] || '').trim(),
            cptModality: String(row['CPT Modality'] || '').trim(),
            monthOfService: monthLabel,
            totalPaymentAmount,
            insurancePayment,
            patientPayment,
            refunds: Math.abs(refunds),
            postedDate,
            netCollected,
            daysToPost,
            refundRate,
          };
        });
        resolve(rows);
      },
      error: reject,
    });
  });
}

export function getFilterOptions(rows) {
  return {
    states: [...new Set(rows.map(r => r.state).filter(Boolean))].sort(),
    insuranceGroupings: [...new Set(rows.map(r => r.insuranceGrouping).filter(Boolean))].sort(),
    cptModalities: [...new Set(rows.map(r => r.cptModality).filter(Boolean))].sort(),
    months: [...new Set(rows.map(r => r.monthOfService).filter(Boolean))].sort(),
  };
}

export function applyFilters(rows, filters) {
  return rows.filter(row => {
    if (filters.states.length > 0 && !filters.states.includes(row.state)) return false;
    if (filters.insuranceGroupings.length > 0 && !filters.insuranceGroupings.includes(row.insuranceGrouping)) return false;
    if (filters.cptModalities.length > 0 && !filters.cptModalities.includes(row.cptModality)) return false;
    if (filters.dateFrom && row.monthOfService < filters.dateFrom) return false;
    if (filters.dateTo && row.monthOfService > filters.dateTo) return false;
    return true;
  });
}

export function computeKPIs(rows) {
  const totalCollected = rows.reduce((s, r) => s + r.netCollected, 0);
  const totalInsurance = rows.reduce((s, r) => s + r.insurancePayment, 0);
  const totalPatient = rows.reduce((s, r) => s + r.patientPayment, 0);
  const totalRefunds = rows.reduce((s, r) => s + r.refunds, 0);
  const totalPayment = rows.reduce((s, r) => s + r.totalPaymentAmount, 0);

  const validDays = rows.filter(r => r.daysToPost !== null);
  const avgDaysToPost = validDays.length > 0
    ? validDays.reduce((s, r) => s + r.daysToPost, 0) / validDays.length
    : 0;

  const insurancePct = totalPayment !== 0 ? (totalInsurance / totalPayment) * 100 : 0;
  const patientPct = totalPayment !== 0 ? (totalPatient / totalPayment) * 100 : 0;
  const refundRate = totalPayment !== 0 ? (totalRefunds / totalPayment) * 100 : 0;

  return { totalCollected, insurancePct, patientPct, refundRate, avgDaysToPost };
}

export function computePayerScorecard(rows) {
  const groups = {};
  for (const row of rows) {
    const key = row.insuranceGrouping || 'Unknown';
    if (!groups[key]) {
      groups[key] = {
        insuranceGrouping: key,
        insurancePayment: 0,
        patientPayment: 0,
        refunds: 0,
        totalPayment: 0,
        netCollected: 0,
        daysSum: 0,
        daysCount: 0,
        claimCount: 0,
      };
    }
    const g = groups[key];
    g.insurancePayment += row.insurancePayment;
    g.patientPayment += row.patientPayment;
    g.refunds += row.refunds;
    g.totalPayment += row.totalPaymentAmount;
    g.netCollected += row.netCollected;
    if (row.daysToPost !== null) { g.daysSum += row.daysToPost; g.daysCount++; }
    g.claimCount++;
  }

  return Object.values(groups).map(g => ({
    ...g,
    refundRate: g.totalPayment !== 0 ? (g.refunds / g.totalPayment) * 100 : 0,
    avgDaysToPost: g.daysCount > 0 ? g.daysSum / g.daysCount : null,
  }));
}

export function computeMonthlyTrend(rows) {
  const cell = {};
  for (const row of rows) {
    const m = row.monthOfService;
    const g = row.insuranceGrouping || 'Unknown';
    const k = `${m}|||${g}`;
    if (!cell[k]) cell[k] = { month: m, grp: g, val: 0 };
    cell[k].val += row.netCollected;
  }

  const months = [...new Set(Object.values(cell).map(c => c.month))].sort();
  const groupings = [...new Set(Object.values(cell).map(c => c.grp))].sort();

  const chartData = months.map(month => {
    const entry = { month };
    for (const g of groupings) {
      const k = `${month}|||${g}`;
      entry[g] = cell[k] ? cell[k].val : 0;
    }
    return entry;
  });

  return { chartData, groupings };
}

export function computeStateComparison(rows) {
  const groups = {};
  for (const row of rows) {
    const s = row.state || 'Unknown';
    if (!groups[s]) groups[s] = { state: s, insurancePayment: 0, patientPayment: 0, total: 0 };
    groups[s].insurancePayment += row.insurancePayment;
    groups[s].patientPayment += row.patientPayment;
    groups[s].total += row.totalPaymentAmount;
  }
  return Object.values(groups).sort((a, b) => b.total - a.total);
}
