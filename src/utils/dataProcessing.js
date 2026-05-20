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

// Field definitions with fuzzy-match keywords for auto-detection.
// Keywords are lowercase; exact header names from the known export are listed first.
export const FIELD_DEFS = [
  {
    key: 'cptCode',
    label: 'CPT Code',
    required: false,
    keywords: ['cptcode', 'cpt code', 'cpt', 'procedure code', 'proc code', 'hcpcs', 'service code'],
  },
  {
    key: 'insuranceGrouping',
    label: 'Insurance Grouping',
    required: true,
    keywords: ['insconame', 'insurancetype', 'insurance type', 'insurance grouping', 'ins grouping',
               'payer group', 'payer category', 'ins group', 'insurance group', 'payer type', 'ins co name'],
  },
  {
    key: 'state',
    label: 'State',
    required: true,
    keywords: ['locstate', 'loc state', 'state', 'location state', 'practice state'],
  },
  {
    key: 'insurancePlanName',
    label: 'Insurance Plan Name',
    required: false,
    keywords: ['insuranceplanname', 'insurance plan name', 'plan name', 'payer name',
               'insurance name', 'ins plan', 'carrier name'],
  },
  {
    key: 'cptModality',
    label: 'CPT Modality',
    required: false,
    keywords: ['modality', 'cpt modality', 'procedure type', 'service type', 'exam type'],
  },
  {
    key: 'monthOfService',
    label: 'Month of Service',
    required: true,
    keywords: ['monthofservice', 'month of service', 'service month', 'svc month', 'dos month'],
  },
  {
    key: 'totalPaymentAmount',
    label: 'Total Payment Amount',
    required: true,
    keywords: ['totpmt', 'tot pmt', 'total payment amount', 'total payment', 'total amount', 'gross payment'],
  },
  {
    key: 'insurancePayment',
    label: 'Insurance Payment',
    required: true,
    keywords: ['inspmt', 'ins pmt', 'insurance payment', 'ins payment', 'payer payment', 'carrier payment'],
  },
  {
    key: 'patientPayment',
    label: 'Patient Payment',
    required: true,
    keywords: ['patpmt', 'pat pmt', 'patient payment', 'patient pay', 'pt payment', 'copay'],
  },
  {
    key: 'refunds',
    label: 'Refunds',
    required: false,
    keywords: ['refund', 'refunds', 'credit', 'refund amount'],
  },
  {
    key: 'paymentPostedDate',
    label: 'Payment Posted Date',
    required: false,
    keywords: ['week_ending_sunday', 'week ending sunday', 'paymonth', 'pay month',
               'payment posted date', 'posted date', 'post date', 'date posted', 'posting date'],
  },
];

// Read only a small slice of the file as text — fast even for huge files
function readChunk(file, bytes = 2048) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      let text = e.target.result ?? '';
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
      resolve(text);
    };
    reader.onerror = reject;
    reader.readAsText(file.slice(0, bytes));
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

// Read only the first 2KB to extract headers — safe for files of any size
export async function extractHeaders(file) {
  const chunk = await readChunk(file, 2048);
  const firstLine = chunk.split(/\r?\n/).find(l => l.trim());
  if (!firstLine) throw new Error('Could not find a header row in the first 2KB of the file');
  const delimiter = sniffDelimiter(firstLine);
  const headers = firstLine
    .split(delimiter)
    .map(h => h.trim().replace(/^["']|["']$/g, ''));
  const valid = headers.filter(Boolean);
  if (!valid.length) throw new Error('First line contains no recognizable column headers');
  return valid;
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

// Parse full file using step callback — processes one row at a time,
// never builds a giant internal array, safe for files of any size
export async function parseCSV(file, columnMap) {
  const chunk = await readChunk(file, 2048);
  const firstLine = chunk.split(/\r?\n/).find(l => l.trim()) || '';
  const delimiter = sniffDelimiter(firstLine);

  return new Promise((resolve, reject) => {
    const rows = [];
    let firstRowLogged = false;

    function buildRow(raw) {
      const get = (key) => {
        const col = columnMap[key];
        return col ? String(raw[col] ?? '').trim() : '';
      };

      const insurancePayment  = parseMoney(get('insurancePayment'));
      const patientPayment    = parseMoney(get('patientPayment'));
      const refunds           = parseMoney(get('refunds'));
      const totalPaymentAmount = parseMoney(get('totalPaymentAmount'));
      const netCollected      = insurancePayment + patientPayment - Math.abs(refunds);

      const monthEnd   = parseMonthOfService(get('monthOfService'));
      const postedDate = parsePostedDate(get('paymentPostedDate'));

      let daysToPost = null;
      if (monthEnd && postedDate && isValid(monthEnd) && isValid(postedDate)) {
        daysToPost = differenceInDays(postedDate, monthEnd);
      }

      const refundRate = totalPaymentAmount !== 0
        ? (Math.abs(refunds) / Math.abs(totalPaymentAmount)) * 100
        : 0;

      let monthLabel = get('monthOfService');
      if (monthEnd && isValid(monthEnd)) monthLabel = format(monthEnd, 'yyyy-MM');

      return {
        cptCode:           get('cptCode'),
        insuranceGrouping: get('insuranceGrouping'),
        state:             get('state'),
        insurancePlanName: get('insurancePlanName'),
        cptModality:       get('cptModality'),
        monthOfService:    monthLabel,
        totalPaymentAmount,
        insurancePayment,
        patientPayment,
        refunds:     Math.abs(refunds),
        postedDate,
        weekEnding:  postedDate && isValid(postedDate) ? format(postedDate, 'yyyy-MM-dd') : '',
        netCollected,
        daysToPost,
        refundRate,
      };
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      // ﻿ = BOM; strip it and any surrounding quotes from header names
      transformHeader: h => h.trim().replace(/^[﻿"']|["']$/g, ''),
      step: ({ data: raw }) => {
        if (!firstRowLogged) {
          console.log('[parseCSV] delimiter detected:', JSON.stringify(delimiter));
          console.log('[parseCSV] column map:', columnMap);
          console.log('[parseCSV] first raw row keys:', Object.keys(raw));
          console.log('[parseCSV] first raw row:', raw);
          firstRowLogged = true;
        }
        rows.push(buildRow(raw));
      },
      complete: () => {
        console.log('[parseCSV] done —', rows.length, 'rows');
        if (rows.length > 0) console.log('[parseCSV] sample parsed row:', rows[0]);
        resolve(rows);
      },
      error: reject,
    });
  });
}

export function getFilterOptions(rows) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return {
    states: [...new Set(rows.map(r => r.state).filter(Boolean))].sort(),
    insuranceGroupings: [...new Set(rows.map(r => r.insuranceGrouping).filter(Boolean))].sort(),
    cptModalities: [...new Set(rows.map(r => r.cptModality).filter(Boolean))].sort(),
    months: [...new Set(rows.map(r => r.monthOfService).filter(Boolean))].sort(),
    postingWeeks: [...new Set(rows.map(r => r.weekEnding).filter(w => w && w <= today))].sort(),
  };
}

export function applyFilters(rows, filters) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return rows.filter(row => {
    // Always exclude incomplete posting weeks (future Sundays)
    if (row.weekEnding && row.weekEnding > today) return false;
    if (filters.states.length > 0 && !filters.states.includes(row.state)) return false;
    if (filters.insuranceGroupings.length > 0 && !filters.insuranceGroupings.includes(row.insuranceGrouping)) return false;
    if (filters.cptModalities.length > 0 && !filters.cptModalities.includes(row.cptModality)) return false;
    if (filters.dateFrom && row.monthOfService < filters.dateFrom) return false;
    if (filters.dateTo && row.monthOfService > filters.dateTo) return false;
    if (filters.postingWeekFrom && row.weekEnding && row.weekEnding < filters.postingWeekFrom) return false;
    if (filters.postingWeekTo && row.weekEnding && row.weekEnding > filters.postingWeekTo) return false;
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

// Weekly trend: group by weekEnding × insuranceGrouping, top 8 payers by volume
export function computeWeeklyTrend(rows) {
  const cell = {};
  for (const row of rows) {
    const week = row.weekEnding;
    if (!week) continue;
    const g = row.insuranceGrouping || 'Unknown';
    const k = `${week}|||${g}`;
    if (!cell[k]) cell[k] = { week, grp: g, val: 0 };
    cell[k].val += row.netCollected;
  }

  const weeks = [...new Set(Object.values(cell).map(c => c.week))].sort();
  const allGroupings = [...new Set(Object.values(cell).map(c => c.grp))];

  const totals = {};
  for (const c of Object.values(cell)) totals[c.grp] = (totals[c.grp] || 0) + c.val;
  const groupings = allGroupings.sort((a, b) => (totals[b] || 0) - (totals[a] || 0)).slice(0, 8);

  const chartData = weeks.map(week => {
    const entry = { week };
    for (const g of groupings) {
      const k = `${week}|||${g}`;
      entry[g] = cell[k] ? cell[k].val : 0;
    }
    entry._total = groupings.reduce((s, g) => s + (entry[g] || 0), 0);
    return entry;
  });

  return { chartData, groupings };
}

// WoW trend summary: last complete week vs prior week, nested InsCoName → InsurancePlanName
export function computeTrendSummary(rows) {
  const allWeeks = [...new Set(rows.map(r => r.weekEnding).filter(Boolean))].sort();
  if (allWeeks.length < 2) return { currentWeek: null, priorWeek: null, data: [] };

  const currentWeek = allWeeks[allWeeks.length - 1];
  const priorWeek   = allWeeks[allWeeks.length - 2];

  const coGroups = {};

  for (const row of rows) {
    if (row.weekEnding !== currentWeek && row.weekEnding !== priorWeek) continue;
    const co   = row.insuranceGrouping || 'Unknown';
    const plan = row.insurancePlanName || '(No Plan)';
    const isCurrent = row.weekEnding === currentWeek;

    if (!coGroups[co]) {
      coGroups[co] = {
        insCoName: co,
        current: { ins: 0, pat: 0, ref: 0, net: 0 },
        prior:   { ins: 0, pat: 0, ref: 0, net: 0 },
        plans: {},
      };
    }
    const g = coGroups[co];
    const period = isCurrent ? g.current : g.prior;
    period.ins += row.insurancePayment;
    period.pat += row.patientPayment;
    period.ref += row.refunds;
    period.net += row.netCollected;

    if (!g.plans[plan]) {
      g.plans[plan] = {
        planName: plan,
        current: { ins: 0, pat: 0, ref: 0, net: 0 },
        prior:   { ins: 0, pat: 0, ref: 0, net: 0 },
      };
    }
    const pp = isCurrent ? g.plans[plan].current : g.plans[plan].prior;
    pp.ins += row.insurancePayment;
    pp.pat += row.patientPayment;
    pp.ref += row.refunds;
    pp.net += row.netCollected;
  }

  const pctChg = (cur, pri) => pri !== 0 ? ((cur - pri) / Math.abs(pri)) * 100 : null;

  const data = Object.values(coGroups).map(g => {
    const netPct = pctChg(g.current.net, g.prior.net);
    return {
      insCoName: g.insCoName,
      current:   g.current,
      prior:     g.prior,
      netPctChange: netPct,
      direction: netPct === null ? 'flat' : netPct > 1 ? 'up' : netPct < -1 ? 'down' : 'flat',
      total: g.current.net + g.prior.net,
      plans: Object.values(g.plans).map(p => ({
        ...p,
        netPctChange: pctChg(p.current.net, p.prior.net),
        direction: (() => { const v = pctChg(p.current.net, p.prior.net); return v === null ? 'flat' : v > 1 ? 'up' : v < -1 ? 'down' : 'flat'; })(),
      })).sort((a, b) => (b.current.net + b.prior.net) - (a.current.net + a.prior.net)),
    };
  }).sort((a, b) => b.total - a.total);

  return { currentWeek, priorWeek, data };
}

// KPI WoW: compare last complete week vs prior week
export function computeKPITrends(rows) {
  const allWeeks = [...new Set(rows.map(r => r.weekEnding).filter(Boolean))].sort();
  if (allWeeks.length < 2) return null;

  const currentWeek = allWeeks[allWeeks.length - 1];
  const priorWeek   = allWeeks[allWeeks.length - 2];

  const recent = rows.filter(r => r.weekEnding === currentWeek);
  const prior  = rows.filter(r => r.weekEnding === priorWeek);
  if (!prior.length) return null;

  const rk = computeKPIs(recent);
  const pk = computeKPIs(prior);

  const pct  = (r, p) => (p !== 0 ? ((r - p) / Math.abs(p)) * 100 : null);
  const diff = (r, p) => r - p;

  return {
    totalCollected: pct(rk.totalCollected, pk.totalCollected),
    insurancePct:   diff(rk.insurancePct,   pk.insurancePct),
    patientPct:     diff(rk.patientPct,     pk.patientPct),
    refundRate:     diff(rk.refundRate,     pk.refundRate),
    avgDaysToPost:  pct(rk.avgDaysToPost,   pk.avgDaysToPost),
  };
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
