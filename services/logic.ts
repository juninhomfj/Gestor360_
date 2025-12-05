import { Sale, CommissionTable, ProductType, SaleFormData, CommissionRule, ClientMetric, AppMode, FinanceAccount, CreditCard, Transaction, TransactionCategory, ImportMapping, ReportConfig, SystemConfig, Snapshot, FinanceGoal, Challenge, ChallengeCell, ChallengeModel, Receivable, AppPreferences } from '../types';
import * as XLSX from 'xlsx';
import CryptoJS from 'crypto-js';

// --- USER SCOPE ---
let currentUserId: string | null = null;

export const setLogicUser = (userId: string) => {
    currentUserId = userId;
};

const getUserKey = (baseKey: string) => {
    if (!currentUserId) throw new Error("Acesso negado: Usuário não autenticado.");
    return `${baseKey}_${currentUserId}`;
};

// --- CONSTANTS ---
const roundTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const DEFAULT_NATAL_RULES: CommissionRule[] = [
  { id: 'n0', minPercent: -999, maxPercent: 4.99, commissionRate: 0 },
  { id: 'n1', minPercent: 5.00, maxPercent: 10.00, commissionRate: 0.0025 },
  { id: 'n2', minPercent: 10.01, maxPercent: 14.00, commissionRate: 0.0050 },
  { id: 'n3', minPercent: 14.01, maxPercent: 18.00, commissionRate: 0.0100 },
  { id: 'n4', minPercent: 18.01, maxPercent: 22.00, commissionRate: 0.0150 },
  { id: 'n5', minPercent: 22.01, maxPercent: 26.00, commissionRate: 0.0200 },
  { id: 'n6', minPercent: 26.01, maxPercent: 30.00, commissionRate: 0.0250 },
  { id: 'n7', minPercent: 30.01, maxPercent: 37.00, commissionRate: 0.0300 },
  { id: 'n8', minPercent: 37.01, maxPercent: 42.00, commissionRate: 0.0400 },
  { id: 'n9', minPercent: 42.01, maxPercent: null, commissionRate: 0.0500 },
];

export const DEFAULT_BASIC_RULES: CommissionRule[] = [
  { id: 'b0', minPercent: -999, maxPercent: 3.99, commissionRate: 0 },
  { id: 'b1', minPercent: 4.00, maxPercent: 4.49, commissionRate: 0.0020 },
  { id: 'b2', minPercent: 4.50, maxPercent: 4.99, commissionRate: 0.0025 },
  { id: 'b3', minPercent: 5.00, maxPercent: 5.49, commissionRate: 0.0030 },
  { id: 'b4', minPercent: 5.50, maxPercent: 5.99, commissionRate: 0.0035 },
  { id: 'b5', minPercent: 6.00, maxPercent: 6.49, commissionRate: 0.0040 },
  { id: 'b6', minPercent: 6.50, maxPercent: 6.99, commissionRate: 0.0045 },
  { id: 'b7', minPercent: 7.00, maxPercent: 9.99, commissionRate: 0.0050 },
  { id: 'b8', minPercent: 10.00, maxPercent: 10.99, commissionRate: 0.0075 },
  { id: 'b9', minPercent: 11.00, maxPercent: 14.99, commissionRate: 0.0100 },
  { id: 'b10', minPercent: 15.00, maxPercent: 17.99, commissionRate: 0.0150 },
  { id: 'b11', minPercent: 18.00, maxPercent: 24.99, commissionRate: 0.0200 },
  { id: 'b12', minPercent: 25.00, maxPercent: 29.99, commissionRate: 0.0300 },
  { id: 'b13', minPercent: 30.00, maxPercent: 39.99, commissionRate: 0.0400 },
  { id: 'b14', minPercent: 40.00, maxPercent: null, commissionRate: 0.0500 },
];

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  daysForNewClient: 30,
  daysForInactive: 45,
  daysForLost: 60
};

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  backupFrequency: 'WEEKLY',
  lastBackupDate: null,
  googleDriveConnected: false,
  includeNonAccountingInTotal: false
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
    hideValues: false,
    salesConfig: { showStats: true, showCharts: true, showRecents: true },
    financeConfig: { showStats: true, showCharts: true, showRecents: true }
};

// --- LOGIC ---

export const calculateMargin = (proposed: number, sold: number): number => {
  if (proposed === 0) return 0;
  const raw = ((sold - proposed) / proposed) * 100;
  return roundTwo(raw);
};

export const findCommissionRate = (margin: number, rules: CommissionRule[]): number => {
  const match = rules.find(r => {
    const minOk = margin >= r.minPercent;
    const maxOk = r.maxPercent === null || margin <= r.maxPercent;
    return minOk && maxOk;
  });
  return match ? match.commissionRate : 0;
};

export const computeSaleMetrics = (data: SaleFormData, rules: CommissionRule[]): Sale => {
  const marginPercent = data.marginPercent; 
  const rate = findCommissionRate(marginPercent, rules);
  const commissionBaseTotal = data.quantity * data.valueProposed;
  
  return {
    ...data,
    id: crypto.randomUUID(),
    marginPercent,
    commissionRateApplied: rate,
    commissionBaseTotal,
    commissionValueTotal: commissionBaseTotal * rate
  };
};

export const recomputeSale = (sale: Sale, rules: CommissionRule[]): Sale => {
  const marginPercent = sale.marginPercent;
  const rate = findCommissionRate(marginPercent, rules);
  const commissionBaseTotal = sale.quantity * sale.valueProposed;

  return {
    ...sale,
    marginPercent,
    commissionRateApplied: rate,
    commissionBaseTotal,
    commissionValueTotal: commissionBaseTotal * rate
  };
};

export const analyzeClients = (sales: Sale[], config: ReportConfig = DEFAULT_REPORT_CONFIG): ClientMetric[] => {
  const clientMap = new Map<string, Sale[]>();

  sales.forEach(sale => {
    const name = sale.client ? sale.client.trim().toUpperCase() : 'DESCONHECIDO';
    if (!clientMap.has(name)) clientMap.set(name, []);
    clientMap.get(name)?.push(sale);
  });

  const now = new Date();
  const metrics: ClientMetric[] = [];

  clientMap.forEach((clientSales, name) => {
    clientSales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const totalOrders = clientSales.length;
    const totalSpent = clientSales.reduce((acc, s) => acc + (s.valueSold * s.quantity), 0);
    
    const lastSale = clientSales[clientSales.length - 1];
    const firstSale = clientSales[0];
    
    const lastDate = new Date(lastSale.date);
    const firstDate = new Date(firstSale.date);

    if (isNaN(lastDate.getTime()) || isNaN(firstDate.getTime())) return;

    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const daysSinceLastPurchase = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const typesBought = Array.from(new Set(clientSales.map(s => s.type)));

    let status: ClientMetric['status'] = 'ACTIVE';
    const daysSinceFirst = Math.ceil(Math.abs(now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceFirst < config.daysForNewClient && totalOrders <= 2) {
        status = 'NEW';
    } else if (daysSinceLastPurchase > config.daysForLost) {
        status = 'LOST';
    } else if (daysSinceLastPurchase > config.daysForInactive) {
        status = 'INACTIVE';
    }

    metrics.push({
      name: name,
      totalOrders,
      totalSpent,
      lastPurchaseDate: lastSale.date,
      firstPurchaseDate: firstSale.date,
      averageTicket: totalOrders > 0 ? totalSpent / totalOrders : 0,
      status,
      daysSinceLastPurchase,
      typesBought
    });
  });

  return metrics.sort((a, b) => a.daysSinceLastPurchase - b.daysSinceLastPurchase);
};

// --- IMPORT / EXPORT ---

export const generateCSVTemplate = () => {
  const headers = ['DATA FATURAMENTO', 'DATA FINALIZACAO', 'TIPO (BASICA/NATAL)', 'CLIENTE', 'ORCAMENTO', 'QTD', 'VLR PROPOSTO', 'VLR VENDA', 'MARGEM (%)', 'RASTREIO', 'STATUS BOLETO', 'OBS'];
  const row1 = ['2025-05-20', '2025-05-15', 'BASICA', 'Empresa Exemplo LTDA', '12345', '10', '75,00', '80,00', '6,66', 'BR123456', 'PENDENTE', 'Primeira compra'];
  const row2 = ['', '2025-12-01', 'NATAL', 'Cliente Teste', '12346', '50', '160,00', '165,00', '3,12', '', 'ENVIADO', 'Campanha Natal (Pendente Faturamento)'];
  
  const csvContent = [
    headers.join(';'),
    row1.join(';'),
    row2.join(';')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'modelo_vendas360.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const parseDate = (dateVal: any): string => {
  if (!dateVal) return '';
  
  // Excel Serial Number
  if (typeof dateVal === 'number') {
      const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
      return !isNaN(date.getTime()) ? date.toISOString() : '';
  }
  
  // Check for Excel serial as string
  const numericDate = Number(dateVal);
  if (!isNaN(numericDate) && numericDate > 20000 && String(dateVal).indexOf('/') === -1 && String(dateVal).indexOf('-') === -1) {
      const date = new Date(Math.round((numericDate - 25569) * 86400 * 1000));
      return !isNaN(date.getTime()) ? date.toISOString() : '';
  }

  const str = String(dateVal).trim();
  
  // Handle empty or whitespace string -> return empty (PENDING)
  if (!str) return '';

  // Handle PT-BR Date format DD/MM/YYYY
  if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
          const [day, month, year] = parts;
          // Handle 2-digit years
          const y = year.length === 2 ? `20${year}` : year;
          const d = new Date(`${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          if (!isNaN(d.getTime())) return d.toISOString();
      }
  }

  // Handle ISO or YYYY-MM-DD
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
      return d.toISOString();
  }

  // If unparseable, return empty (safer than crashing or wrong date)
  return '';
};

const parseMoney = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  
  let clean = String(val).trim();
  
  // Detect format: 1.200,50 vs 1,200.50
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');

  if (lastComma > lastDot) {
      // PT-BR format: 1.200,50 -> Remove dots, replace comma with dot
      clean = clean.replace(/\./g, '');
      clean = clean.replace(',', '.');
  } else if (lastComma !== -1 && lastDot !== -1 && lastComma < lastDot) {
      // US format with thousands separator: 1,200.50 -> Remove commas
      clean = clean.replace(/,/g, '');
  }

  clean = clean.replace(/[^\d.-]/g, '');
  return parseFloat(clean) || 0;
};

export const readExcelFile = async (file: File): Promise<any[][]> => {
  let rows: any[] = [];
  
  if (file.name.endsWith('.csv')) {
    const text = await file.text();
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) rows.push(line.split(';'));
    }
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  }
  
  return rows;
};

export const processImportWithMapping = (rows: any[][], mapping: ImportMapping, rulesBasic: CommissionRule[], rulesNatal: CommissionRule[]): Sale[] => {
  const sales: Sale[] = [];
  const today = new Date().toISOString();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const getValue = (colName: string) => {
        const idx = mapping[colName];
        if (idx === undefined || idx === -1) return '';
        return row[idx];
    };

    const typeStr = String(getValue('type')).toUpperCase();
    const type = typeStr.includes('NATAL') ? ProductType.NATAL : ProductType.BASICA;
    
    const qtyRaw = getValue('quantity');
    const qty = parseMoney(qtyRaw);
    
    const client = String(getValue('client'));
    
    if (!client || qty <= 0) continue;

    // Dates Logic
    const rawDate = getValue('date'); // Faturamento
    const rawCompletionDate = getValue('completionDate'); // Finalizacao

    // Important: parseDate returns empty string if invalid/empty
    // If billing date (date) is empty, it remains empty (PENDING)
    let date = parseDate(rawDate); 
    
    // If completion date is missing, assume today (Import Date)
    let completionDate = parseDate(rawCompletionDate);
    if (!completionDate) completionDate = today;

    // Margin Logic (Fix 0.42 issue)
    const marginRaw = getValue('margin');
    let margin = 0;
    if (marginRaw) {
        margin = parseMoney(marginRaw);
        if (margin <= 1.0 && margin > -1.0 && margin !== 0) {
            margin = margin * 100;
        }
    } else {
        // Auto-calc if missing
        margin = calculateMargin(parseMoney(getValue('valueProposed')), parseMoney(getValue('valueSold')));
    }

    const formData: SaleFormData = {
      client: client,
      quantity: qty,
      type: type,
      valueProposed: parseMoney(getValue('valueProposed')),
      valueSold: parseMoney(getValue('valueSold')),
      date: date, // Can be empty string
      observations: String(getValue('obs')),
      quoteNumber: String(getValue('quote')),
      completionDate: completionDate,
      trackingCode: String(getValue('tracking')),
      boletoStatus: String(getValue('boletoStatus')).toUpperCase() as any || 'PENDING',
      marginPercent: margin
    };

    const activeRules = type === ProductType.BASICA ? rulesBasic : rulesNatal;
    sales.push(computeSaleMetrics(formData, activeRules));
  }
  return sales;
};

// --- STORAGE KEYS ---
const BASE_KEYS = {
    SALES: 'app_sales_v1',
    TABLE_BASIC: 'app_table_basic_v2',
    TABLE_NATAL: 'app_table_natal_v2',
    REPORT_CONFIG: 'app_report_config_v1',
    SYSTEM_CONFIG: 'app_system_config_v1',
    THEME: 'app_theme_v1',
    APP_PREFERENCES: 'app_preferences_v1',
    FIN_ACCOUNTS: 'fin_accounts_v1',
    FIN_CARDS: 'fin_cards_v1',
    FIN_TRANSACTIONS: 'fin_transactions_v1',
    FIN_CATEGORIES: 'fin_categories_v1',
    FIN_GOALS: 'fin_goals_v1',
    FIN_CHALLENGES: 'fin_challenges_v1',
    FIN_CELLS: 'fin_cells_v1',
    FIN_RECEIVABLES: 'fin_receivables_v1', // Stores Master Account (A Receber)
};

// --- DATA ACCESS ---

const safeParseArray = (json: string | null): any[] => {
    if (!json) return [];
    try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) return parsed.filter(item => item !== null && typeof item === 'object');
        return [];
    } catch {
        return [];
    }
};

export const getStoredSales = (): Sale[] => {
  try {
      const data = safeParseArray(localStorage.getItem(getUserKey(BASE_KEYS.SALES)));
      return data.map((sale: any) => ({
          ...sale,
          client: sale.client || 'Cliente Desconhecido',
          date: sale.date || '' // Allow empty date for pending
      }));
  } catch (e) {
      return [];
  }
};

export const clearAllSales = () => {
  localStorage.removeItem(getUserKey(BASE_KEYS.SALES));
};

export const getStoredTable = (type: ProductType): CommissionRule[] => {
  try {
    const key = type === ProductType.BASICA ? BASE_KEYS.TABLE_BASIC : BASE_KEYS.TABLE_NATAL;
    const s = localStorage.getItem(getUserKey(key));
    if (s) return JSON.parse(s);
  } catch (e) { console.error('Error loading tables', e); }
  return type === ProductType.BASICA ? DEFAULT_BASIC_RULES : DEFAULT_NATAL_RULES;
};

export const getReportConfig = (): ReportConfig => {
  try {
    const s = localStorage.getItem(getUserKey(BASE_KEYS.REPORT_CONFIG));
    if (s) return JSON.parse(s);
  } catch (e) { console.error(e); }
  return DEFAULT_REPORT_CONFIG;
};

export const saveReportConfig = (config: ReportConfig) => {
  localStorage.setItem(getUserKey(BASE_KEYS.REPORT_CONFIG), JSON.stringify(config));
};

export const getSystemConfig = (): SystemConfig => {
  try {
    const s = localStorage.getItem(getUserKey(BASE_KEYS.SYSTEM_CONFIG));
    if (s) return JSON.parse(s);
  } catch (e) { console.error(e); }
  return DEFAULT_SYSTEM_CONFIG;
};

export const saveSystemConfig = (config: SystemConfig) => {
  localStorage.setItem(getUserKey(BASE_KEYS.SYSTEM_CONFIG), JSON.stringify(config));
};

export const getAppPreferences = (): AppPreferences => {
    try {
        const s = localStorage.getItem(getUserKey(BASE_KEYS.APP_PREFERENCES));
        if (s) return JSON.parse(s);
    } catch (e) { console.error(e); }
    return DEFAULT_APP_PREFERENCES;
};

export const saveAppPreferences = (prefs: AppPreferences) => {
    localStorage.setItem(getUserKey(BASE_KEYS.APP_PREFERENCES), JSON.stringify(prefs));
};

export const saveSales = (sales: Sale[]) => {
  localStorage.setItem(getUserKey(BASE_KEYS.SALES), JSON.stringify(sales));
};

export const saveTable = (type: ProductType, rules: CommissionRule[]) => {
  const key = type === ProductType.BASICA ? BASE_KEYS.TABLE_BASIC : BASE_KEYS.TABLE_NATAL;
  localStorage.setItem(getUserKey(key), JSON.stringify(rules));
};

export const saveTheme = (theme: 'light' | 'dark') => {
    try { if (currentUserId) localStorage.setItem(getUserKey(BASE_KEYS.THEME), theme); } catch {}
};

export const getTheme = (): 'light' | 'dark' => {
    try { 
        if (!currentUserId) return 'dark';
        const theme = localStorage.getItem(getUserKey(BASE_KEYS.THEME));
        return theme === 'light' ? 'light' : 'dark';
    } catch { return 'dark'; }
};

// --- UNDO / SNAPSHOT ---
const SNAPSHOT_KEY = 'app_snapshot';

export const takeSnapshot = (sales: Sale[]) => {
    if (!currentUserId) return;
    const snapshot: Snapshot = {
        sales: sales,
        timestamp: Date.now()
    };
    sessionStorage.setItem(`${SNAPSHOT_KEY}_${currentUserId}`, JSON.stringify(snapshot));
};

export const hasSnapshot = (): boolean => {
    if (!currentUserId) return false;
    return !!sessionStorage.getItem(`${SNAPSHOT_KEY}_${currentUserId}`);
};

export const restoreSnapshot = (): Sale[] | null => {
    if (!currentUserId) return null;
    const s = sessionStorage.getItem(`${SNAPSHOT_KEY}_${currentUserId}`);
    if (!s) return null;
    try {
        const snapshot: Snapshot = JSON.parse(s);
        return snapshot.sales;
    } catch (e) { return null; }
};

export const clearSnapshot = () => {
    if (!currentUserId) return;
    sessionStorage.removeItem(`${SNAPSHOT_KEY}_${currentUserId}`);
};

// --- BACKUP REMINDER ---
export const checkBackupReminder = (): boolean => {
    const config = getSystemConfig();
    if (config.backupFrequency === 'NEVER') return false;
    if (!config.lastBackupDate) return true;

    const last = new Date(config.lastBackupDate).getTime();
    const now = Date.now();
    const diffDays = (now - last) / (1000 * 60 * 60 * 24);

    if (config.backupFrequency === 'DAILY' && diffDays >= 1) return true;
    if (config.backupFrequency === 'WEEKLY' && diffDays >= 7) return true;
    if (config.backupFrequency === 'MONTHLY' && diffDays >= 30) return true;

    return false;
};

// --- FINANCE LOGIC ---

export const getFinanceData = () => {
    try {
        return {
            accounts: safeParseArray(localStorage.getItem(getUserKey(BASE_KEYS.FIN_ACCOUNTS))) as FinanceAccount[],
            cards: safeParseArray(localStorage.getItem(getUserKey(BASE_KEYS.FIN_CARDS))) as CreditCard[],
            transactions: safeParseArray(localStorage.getItem(getUserKey(BASE_KEYS.FIN_TRANSACTIONS))) as Transaction[],
            categories: safeParseArray(localStorage.getItem(getUserKey(BASE_KEYS.FIN_CATEGORIES))) as TransactionCategory[],
            goals: safeParseArray(localStorage.getItem(getUserKey(BASE_KEYS.FIN_GOALS))) as FinanceGoal[],
            challenges: safeParseArray(localStorage.getItem(getUserKey(BASE_KEYS.FIN_CHALLENGES))) as Challenge[],
            cells: safeParseArray(localStorage.getItem(getUserKey(BASE_KEYS.FIN_CELLS))) as ChallengeCell[],
            receivables: safeParseArray(localStorage.getItem(getUserKey(BASE_KEYS.FIN_RECEIVABLES))) as Receivable[]
        };
    } catch (e) {
        console.error("Critical error loading finance data, resetting to empty", e);
        return { accounts: [], cards: [], transactions: [], categories: [], goals: [], challenges: [], cells: [], receivables: [] };
    }
};

export const saveFinanceData = (
    accounts: FinanceAccount[],
    cards: CreditCard[],
    transactions: Transaction[],
    categories: TransactionCategory[],
    goals: FinanceGoal[] = [],
    challenges: Challenge[] = [],
    cells: ChallengeCell[] = [],
    receivables: Receivable[] = []
) => {
    try {
        localStorage.setItem(getUserKey(BASE_KEYS.FIN_ACCOUNTS), JSON.stringify(accounts));
        localStorage.setItem(getUserKey(BASE_KEYS.FIN_CARDS), JSON.stringify(cards));
        localStorage.setItem(getUserKey(BASE_KEYS.FIN_TRANSACTIONS), JSON.stringify(transactions));
        localStorage.setItem(getUserKey(BASE_KEYS.FIN_CATEGORIES), JSON.stringify(categories));
        localStorage.setItem(getUserKey(BASE_KEYS.FIN_GOALS), JSON.stringify(goals));
        localStorage.setItem(getUserKey(BASE_KEYS.FIN_CHALLENGES), JSON.stringify(challenges));
        localStorage.setItem(getUserKey(BASE_KEYS.FIN_CELLS), JSON.stringify(cells));
        localStorage.setItem(getUserKey(BASE_KEYS.FIN_RECEIVABLES), JSON.stringify(receivables));
    } catch (e) {
        console.error("Failed to save finance data", e);
    }
};

export const calculateCardLimitUsed = (cardId: string, transactions: Transaction[], closingDay: number): number => {
    return transactions
        .filter(t => t.cardId === cardId && !t.isPaid && t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amount, 0);
};

export const getMonthlyCommissionSummary = (sales: Sale[]) => {
    const grouped: Record<string, number> = {};
    sales.forEach(s => {
        if (!s.date) return;
        const d = new Date(s.date);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        if (!grouped[key]) grouped[key] = 0;
        grouped[key] += s.commissionValueTotal;
    });
    
    return Object.entries(grouped)
        .map(([month, total]) => ({ month, total }))
        .sort((a,b) => b.month.localeCompare(a.month));
};

// --- CHALLENGES ---
export const generateChallengeCells = (challengeId: string, targetValue: number, count: number, model: ChallengeModel): ChallengeCell[] => {
    const cells: ChallengeCell[] = [];
    
    if (model === 'PROPORTIONAL') {
        const baseVal = Math.floor((targetValue / count) * 100) / 100;
        const totalBase = baseVal * count;
        const diff = targetValue - totalBase;

        for (let i = 1; i <= count; i++) {
            let val = baseVal;
            if (i === count) val += diff; // Add diff to last one
            cells.push({ id: crypto.randomUUID(), challengeId, number: i, value: roundTwo(val), status: 'PENDING' });
        }
    } else if (model === 'LINEAR') {
        // Sum of 1..N = N(N+1)/2
        const sumSequence = (count * (count + 1)) / 2;
        const factor = targetValue / sumSequence;
        
        let runningTotal = 0;
        for (let i = 1; i < count; i++) {
            const val = roundTwo(i * factor);
            runningTotal += val;
            cells.push({ id: crypto.randomUUID(), challengeId, number: i, value: val, status: 'PENDING' });
        }
        // Last one takes remainder to be exact
        cells.push({ id: crypto.randomUUID(), challengeId, number: count, value: roundTwo(targetValue - runningTotal), status: 'PENDING' });
    } else {
        // Custom = 0
        for (let i = 1; i <= count; i++) {
            cells.push({ id: crypto.randomUUID(), challengeId, number: i, value: 0, status: 'PENDING' });
        }
    }
    
    return cells;
};

// --- ENCRYPTED BACKUP ---

export const exportEncryptedBackup = async (passphrase: string) => {
    const sysConfig = getSystemConfig();
    sysConfig.lastBackupDate = new Date().toISOString();
    saveSystemConfig(sysConfig);

    const dataToBackup = {
        version: "2.3",
        timestamp: new Date().toISOString(),
        sales: getStoredSales(),
        rules: {
            basic: getStoredTable(ProductType.BASICA),
            natal: getStoredTable(ProductType.NATAL)
        },
        reportConfig: getReportConfig(),
        systemConfig: sysConfig,
        finance: getFinanceData(),
        preferences: getAppPreferences()
    };

    const jsonString = JSON.stringify(dataToBackup);
    const encrypted = CryptoJS.AES.encrypt(jsonString, passphrase).toString();

    const blob = new Blob([encrypted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_vendas360_${currentUserId}_${new Date().toISOString().slice(0,10)}.v360`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const importEncryptedBackup = async (file: File, passphrase: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const encryptedContent = e.target?.result as string;
                let originalText = '';
                
                try {
                    const bytes = CryptoJS.AES.decrypt(encryptedContent, passphrase);
                    originalText = bytes.toString(CryptoJS.enc.Utf8);
                } catch {
                    throw new Error("Senha incorreta.");
                }

                if (!originalText) throw new Error("Senha incorreta ou arquivo corrompido.");

                const parsedData = JSON.parse(originalText);
                
                if (!parsedData.sales || !Array.isArray(parsedData.sales)) {
                    throw new Error("Formato inválido: Vendas.");
                }

                saveSales(parsedData.sales);
                saveTable(ProductType.BASICA, parsedData.rules?.basic || DEFAULT_BASIC_RULES);
                saveTable(ProductType.NATAL, parsedData.rules?.natal || DEFAULT_NATAL_RULES);
                if(parsedData.reportConfig) saveReportConfig(parsedData.reportConfig);
                if(parsedData.systemConfig) saveSystemConfig(parsedData.systemConfig);
                if(parsedData.preferences) saveAppPreferences(parsedData.preferences);

                if (parsedData.finance) {
                    saveFinanceData(
                        parsedData.finance.accounts || [],
                        parsedData.finance.cards || [],
                        parsedData.finance.transactions || [],
                        parsedData.finance.categories || [],
                        parsedData.finance.goals || [],
                        parsedData.finance.challenges || [],
                        parsedData.finance.cells || [],
                        parsedData.finance.receivables || []
                    );
                }

                resolve(true);
            } catch (error) {
                console.error(error);
                reject(error);
            }
        };
        reader.readAsText(file);
    });
};

// ADDED for Pending Sales bulk update
export const updateSalesBatch = (
  currentSales: Sale[],
  idsToUpdate: string[],
  newDate: string
): Sale[] => {
  return currentSales.map(sale => {
    if (idsToUpdate.includes(sale.id)) {
      return { ...sale, date: newDate };
    }
    return sale;
  });
};