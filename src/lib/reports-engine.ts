import { parseISO, isAfter, isBefore, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export type ReportPeriod = 'current_month' | 'previous_month' | 'last_3_months' | 'all';
export type ReportTemplate = 'executive' | 'budget_vs_real' | 'category_breakdown' | 'ai_health';

export interface ReportConfig {
  period: ReportPeriod;
  categories?: string[];
  template: ReportTemplate;
}

export interface CategorySummary {
  category: string;
  income: number;
  expenses: number;
  budgetAmount: number;
  variance: number;
  variancePercentage: number;
}

export interface ReportData {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage
  dtiRatio: number; // Debt to Income ratio percentage
  totalAccountsBalance: number;
  totalPendingDebt: number;
  totalDebtorsCredit: number;
  categoryBreakdown: CategorySummary[];
  topExpenses: Array<{ description: string; amount: number; category: string; date: string }>;
  recentTransactionsCount: number;
  config: ReportConfig;
}

export interface RawTransactionItem {
  id?: string;
  description: string;
  amount: number;
  realUsdAmount?: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

export interface RawAccountItem {
  id?: string;
  name?: string;
  balance?: number;
  isActive?: boolean;
}

export interface RawDebtItem {
  id?: string;
  type?: string;
  status?: string;
  total?: number;
  paid?: number;
}

export interface RawScheduledPaymentItem {
  id?: string;
  name?: string;
  amount?: number;
  isActive?: boolean;
}

/**
 * Filtra un arreglo de transacciones según el período seleccionado.
 */
export function filterTransactionsByPeriod(transactions: RawTransactionItem[], period: ReportPeriod): RawTransactionItem[] {
  const now = new Date();
  
  switch (period) {
    case 'current_month': {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return transactions.filter(t => {
        const d = parseISO(t.date);
        return !isBefore(d, start) && !isAfter(d, end);
      });
    }
    case 'previous_month': {
      const prevMonth = subMonths(now, 1);
      const start = startOfMonth(prevMonth);
      const end = endOfMonth(prevMonth);
      return transactions.filter(t => {
        const d = parseISO(t.date);
        return !isBefore(d, start) && !isAfter(d, end);
      });
    }
    case 'last_3_months': {
      const threeMonthsAgo = startOfMonth(subMonths(now, 2));
      const end = endOfMonth(now);
      return transactions.filter(t => {
        const d = parseISO(t.date);
        return !isBefore(d, threeMonthsAgo) && !isAfter(d, end);
      });
    }
    case 'all':
    default:
      return transactions;
  }
}

/**
 * Procesa y agrega datos financieros para armar el objeto ReportData.
 */
export function buildReportData(
  allTransactions: RawTransactionItem[],
  accounts: RawAccountItem[],
  debts: RawDebtItem[],
  scheduledPayments: RawScheduledPaymentItem[],
  config: ReportConfig
): ReportData {
  const filteredTx = filterTransactionsByPeriod(allTransactions, config.period);
  
  // Categorías filtradas si fueron especificadas
  const activeTx = (config.categories && config.categories.length > 0)
    ? filteredTx.filter(t => config.categories?.includes(t.category))
    : filteredTx;

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryMap = new Map<string, { income: number; expenses: number }>();

  for (const t of activeTx) {
    const usd = t.realUsdAmount ?? t.amount;
    const cat = t.category || 'Other';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { income: 0, expenses: 0 });
    }
    const catEntry = categoryMap.get(cat)!;

    if (t.type === 'income') {
      totalIncome += usd;
      catEntry.income += usd;
    } else {
      const absExp = Math.abs(usd);
      totalExpenses += absExp;
      catEntry.expenses += absExp;
    }
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Cuentas y Deudas
  const totalAccountsBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  
  const totalPendingDebt = debts
    .filter(d => d.type === 'Debt' && d.status === 'Pendiente')
    .reduce((acc, d) => acc + ((d.total || 0) - (d.paid || 0)), 0);

  const totalDebtorsCredit = debts
    .filter(d => d.type === 'Debtor' && d.status === 'Pendiente')
    .reduce((acc, d) => acc + ((d.total || 0) - (d.paid || 0)), 0);

  const dtiRatio = totalIncome > 0 ? (totalPendingDebt / totalIncome) * 100 : 0;

  // Mapa de Presupuestos Programados
  const budgetMap = new Map<string, number>();
  for (const sp of scheduledPayments) {
    if (sp.isActive) {
      const cat = sp.name || 'Other';
      budgetMap.set(cat, (budgetMap.get(cat) || 0) + (sp.amount || 0));
    }
  }

  // Resumen por categoría
  const categoryBreakdown: CategorySummary[] = Array.from(categoryMap.entries()).map(([category, vals]) => {
    const budgetAmount = budgetMap.get(category) || 0;
    const variance = vals.expenses - budgetAmount;
    const variancePercentage = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
    return {
      category,
      income: vals.income,
      expenses: vals.expenses,
      budgetAmount,
      variance,
      variancePercentage,
    };
  }).sort((a, b) => b.expenses - a.expenses);

  // Top 5 Mayores Gastos
  const topExpenses = activeTx
    .filter(t => t.type === 'expense')
    .sort((a, b) => (b.realUsdAmount ?? b.amount) - (a.realUsdAmount ?? a.amount))
    .slice(0, 5)
    .map(t => ({
      description: t.description,
      amount: Math.abs(t.realUsdAmount ?? t.amount),
      category: t.category,
      date: t.date,
    }));

  const periodLabels: Record<ReportPeriod, string> = {
    current_month: 'Mes Actual',
    previous_month: 'Mes Anterior',
    last_3_months: 'Últimos 3 Meses',
    all: 'Histórico Completo',
  };

  const dates = activeTx.map(t => t.date).sort();
  const startDate = dates.length > 0 ? dates[0] : format(new Date(), 'yyyy-MM-01');
  const endDate = dates.length > 0 ? dates[dates.length - 1] : format(new Date(), 'yyyy-MM-dd');

  return {
    periodLabel: periodLabels[config.period],
    startDate,
    endDate,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    dtiRatio,
    totalAccountsBalance,
    totalPendingDebt,
    totalDebtorsCredit,
    categoryBreakdown,
    topExpenses,
    recentTransactionsCount: activeTx.length,
    config,
  };
}

/**
 * Genera el documento Markdown optimizado con prompt para IA.
 */
export function generateReportMarkdown(data: ReportData): string {
  const titleMap: Record<ReportTemplate, string> = {
    executive: 'Informe Financiero Ejecutivo',
    budget_vs_real: 'Informe Presupuesto vs Real',
    category_breakdown: 'Análisis Detallado por Categoría',
    ai_health: 'Evaluación de Salud Financiera para IA',
  };

  const title = titleMap[data.config.template] || 'Informe Financiero';

  let markdown = `# ${title.toUpperCase()}\n`;
  markdown += `**Período Evaluado:** ${data.periodLabel} (${data.startDate} a ${data.endDate})\n`;
  markdown += `**Generado el:** ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;

  markdown += `## 1. Resumen Ejecutivo (KPIs Clave)\n`;
  markdown += `- **Ingresos Totales:** $${data.totalIncome.toFixed(2)}\n`;
  markdown += `- **Gastos Totales:** $${data.totalExpenses.toFixed(2)}\n`;
  markdown += `- **Margen de Ahorro Neto:** $${data.netSavings.toFixed(2)} (${data.savingsRate.toFixed(1)}%)\n`;
  markdown += `- **Saldo Total en Cuentas:** $${data.totalAccountsBalance.toFixed(2)}\n`;
  markdown += `- **Deuda Pendiente Total:** $${data.totalPendingDebt.toFixed(2)}\n`;
  markdown += `- **Crédito a Favor (Cobros Pendientes):** $${data.totalDebtorsCredit.toFixed(2)}\n`;
  markdown += `- **Ratio Deuda/Ingreso (DTI):** ${data.dtiRatio.toFixed(1)}%\n\n`;

  markdown += `## 2. Desglose de Gastos por Categoría\n`;
  markdown += `| Categoría | Ingresos ($) | Gastos ($) | Presupuesto ($) | Desviación ($) | Desviación (%) |\n`;
  markdown += `|---|---|---|---|---|---|\n`;

  if (data.categoryBreakdown.length === 0) {
    markdown += `| No hay datos registrados para este período | - | - | - | - | - |\n`;
  } else {
    for (const cat of data.categoryBreakdown) {
      const varStr = cat.variance > 0 ? `+$${cat.variance.toFixed(2)}` : `-$${Math.abs(cat.variance).toFixed(2)}`;
      const varPctStr = cat.variancePercentage !== 0 ? `${cat.variancePercentage > 0 ? '+' : ''}${cat.variancePercentage.toFixed(1)}%` : '0%';
      markdown += `| ${cat.category} | $${cat.income.toFixed(2)} | $${cat.expenses.toFixed(2)} | $${cat.budgetAmount.toFixed(2)} | ${varStr} | ${varPctStr} |\n`;
    }
  }
  markdown += `\n`;

  if (data.topExpenses.length > 0) {
    markdown += `## 3. Top 5 Mayores Gastos del Período\n`;
    markdown += `| Fecha | Descripción | Categoría | Monto ($) |\n`;
    markdown += `|---|---|---|---|\n`;
    for (const exp of data.topExpenses) {
      markdown += `| ${exp.date} | ${exp.description} | ${exp.category} | $${exp.amount.toFixed(2)} |\n`;
    }
    markdown += `\n`;
  }

  markdown += `---\n\n`;
  markdown += `## 4. Prompt Optimizado para Inteligencia Artificial (Copiar y Pegar)\n`;
  markdown += `\`\`\`text\n`;
  markdown += `Actúa como un experto analista financiero personal (CFO). Con base en las métricas e informe superior:\n`;
  markdown += `1. Analiza la tasa de ahorro actual (${data.savingsRate.toFixed(1)}%) y la relación Deuda/Ingresos (${data.dtiRatio.toFixed(1)}%).\n`;
  markdown += `2. Identifica las 3 mayores fugas de capital o desviaciones de presupuesto.\n`;
  markdown += `3. Proporciona una estrategia de 3 pasos concretos para optimizar mi flujo de caja en un 5% a 10% el próximo mes sin comprometer mis obligaciones de deuda.\n`;
  markdown += `\`\`\`\n`;

  return markdown;
}
