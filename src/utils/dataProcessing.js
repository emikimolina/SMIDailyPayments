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

// Field definitions with fuzzy-match keywords for auto-detection
export const FIELD_DEFS = [
  {
    key: 'cptCode',
    label: 'CPT Code',
    required: false,
    keywords: ['cpt code', 'cpt', 'procedure code', 'proc code', 'hcpcs', 'service code'],
  },
  {
    key: 'insuranceGrouping',
    label: 'Insurance Grouping',
    required: true,
    keywords: ['insurance grouping', 'ins grouping', 'payer group', 'payer category', 'ins group', 'insurance group', 'payer type'],
  },
  {
    key: 'state',
    label: 'State',
    required: true,
    keywords: ['state', ' st ', 'location state', 'practice state'],
  },
  {
    key: 'insurancePlanName',
    label: 'Insurance Plan Name',
    required: false,
    keywords: ['insurance plan name', 'plan name', 'payer name', 'insurance name', 'ins plan', 'carrier name'],
  },
  {
    key: 'cptModality',
    label: 'CPT Modality',
    required: false,
    keywords: ['cpt modality', 'modality', 'procedure type', 'service type', 'exam type'],
  },
  {
    key: 'monthOfService',
    label: 'Month of Service',
    required: true,
    keywords: ['month of service', 'service month', 'svc month', 'dos month', 'date of service month'],
  },
  {
    key: 'totalPaymentAmount',
    label: 'Total Payment Amount',
    required: true,
    keywords: ['total payment amount', 'total payment', 'total amount', 'gross payment', 'total pay'],
  },
  {
    key: 'insurancePayment',
    label: 'Insurance Payment',
    required: true,
    keywords: ['insurance payment', 'ins payment', 'payer payment', 'carrier payment', 'ins pay', 'insurance pay'],
  },
  {
    key: 'patientPayment',
    label: 'Patient Payment',
    required: true,
    keywords: ['patient payment', 'patient pay', 'pt payment', 'copay', 'co-pay', 'patient responsibility'],
  },
  {
    key: 'refunds',
    label: 'Refunds',
    required: false,
    keywords: ['refunds', 'refund', 'credit', 'refund amount'],
  },
  {
    key: 'paymentPostedDate',
    label: 'Payment Posted Date',
    required: false,
    keywords: ['payment posted date', 'posted date', 'post date', 'date posted', 'posting date', 'payment date'],
  },
];

// Read file as text, sniff the delimiter from the first line
function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function sniffDelimiter(firstLine) {
  const candidates = [
    { d: '|',  n: (firstLine.match(/\|/g)  || []).length },
    { d: '\t', n: (firstLine.match(/\t/g)  || []).length },
    { d: ',',  n: (firstLine.match(/,/g)   || []).length },
    { d: ';',  n: (firstLine.match(/;/g)   || []).length },
  ];
  return candidates.sort((a, b) => b.n - a.n)[0].d;
}

// Extract just the header row from a file without parsing all data
export async function extractHeaders(file) {
  const text = await readFileText(file);
  const firstLine = text.split(/\r?\n/)[0];
  const delimiter = sniffDelimiter(firstLine);
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      transformHeader: h => h.trim(),
      preview: 1,
      complete: ({ meta }) => resolve(meta.fields || []),
      error: reject,
    });
  });
}

// Fuzzy-match file headers to dashboard fields
export function detectColumnMap(headers) {
  const normalized = headers.map(h => ({ original: h, lower: h.toLowerCase().trim() }));
  const map = {};

  for (const field of FIELD_DEFS) {
    // 1. Exact label match (case-insensitive)
    let found = normalized.find(({ lower }) => lower === field.label.toLowerCase());

    // 2. Keyword containment match
    if (!found) {
      for (const kw of field.keywords) {
        found = normalized.find(({ lower }) => lower.includes(kw) || kw.includes(lower));
        if (found) break;
      }
    }

    map[field.key] = found ? found.original : '';
  }

  return map;
}

// Parse full CSV using the confirmed column map
export async function parseCSV(file, columnMap) {
  const text = await readFileText(file);
  const firstLine = text.split(/\r?\n/)[0];
  const delimiter = sniffDelimiter(firstLine);
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      transformHeader: h => h.trim(),
      complete: ({ data }) => {
        const rows = data.map(row => {
          const get = (key) => {
            const col = columnMap[key];
            return col ? String(row[col] ?? '').trim() : '';
          };

          const insurancePayment = parseMoney(get('insurancePayment'));
          const patientPayment = parseMoney(get('patientPayment'));
          const refunds = parseMoney(get('refunds'));
          const totalPaymentAmount = parseMoney(get('totalPaymentAmount'));
          const netCollected = insurancePayment + patientPayment - Math.abs(refunds);

          const monthEnd = parseMonthOfService(get('monthOfService'));
          const postedDate = parsePostedDate(get('paymentPostedDate'));

          let daysToPost = null;
          if (monthEnd && postedDate && isValid(monthEnd) && isValid(postedDate)) {
            daysToPost = differenceInDays(postedDate, monthEnd);
          }

          const refundRate = totalPaymentAmount !== 0
            ? (Math.abs(refunds) / Math.abs(totalPaymentAmount)) * 100
            : 0;

          let monthLabel = get('monthOfService');
          if (monthEnd && isValid(monthEnd)) {
            monthLabel = format(monthEnd, 'yyyy-MM');
          }

          return {
            cptCode: get('cptCode'),
            insuranceGrouping: get('insuranceGrouping'),
            state: get('state'),
            insurancePlanName: get('insurancePlanName'),
            cptModality: get('cptModality'),
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
