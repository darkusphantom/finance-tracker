import { differenceInDays, parseISO } from 'date-fns';

/**
 * Parámetros de entrada para el cálculo dinámico de comisiones en deudas.
 *
 * @interface DebtCalculationInput
 * @property {number} total - Monto principal inicial prestado o adeudado.
 * @property {number} paid - Monto acumulado ya pagado.
 * @property {string | null} date - Fecha inicial del préstamo o registro.
 * @property {number | null} [weeklyFee] - Comisión fija recurrente por cada semana transcurrida.
 * @property {string | null} [commissionStartDate] - Fecha específica a partir de la cual comienzan a correr las comisiones (opcional).
 * @property {string | null} [freezeDate] - Fecha límite en la cual se detiene el acumulado de comisiones (opcional).
 * @property {'Pendiente' | 'Listo' | string} status - Estado de la deuda en Notion.
 */
export interface DebtCalculationInput {
  total: number;
  paid: number;
  date: string | null;
  weeklyFee?: number | null;
  commissionStartDate?: string | null;
  freezeDate?: string | null;
  status: string;
  type?: string;
}

/**
 * Resultado estructurado con todos los valores financieros recalculados para una deuda.
 *
 * @interface DebtCalculationResult
 * @property {number} weeksElapsed - Cantidad de semanas completas transcurridas sin saldar.
 * @property {number} accruedCommission - Comisión acumulada total a la fecha de corte ($).
 * @property {number} adjustedTotal - Deuda total ajustada (Monto Principal + Comisión Acumulada).
 * @property {number} saldoPendiente - Saldo pendiente neto por abonar a la fecha de corte.
 * @property {boolean} isFrozen - Indica si la acumulación de comisiones está congelada por fecha o por estado.
 */
export interface DebtCalculationResult {
  weeksElapsed: number;
  accruedCommission: number;
  adjustedTotal: number;
  saldoPendiente: number;
  isFrozen: boolean;
}

/**
 * Calcula dinámicamente las semanas impagadas, comisiones semanales acumuladas y el saldo pendiente ajustado.
 * Las comisiones aplican EXCLUSIVAMENTE para los deudores (`type === 'Debtor'`).
 *
 * @param {DebtCalculationInput} debt - Datos originales de la deuda.
 * @returns {DebtCalculationResult} Valores recalculados dinámicamente con precisión temporal.
 *
 * @example
 * const result = calculateDebtCommissions({
 *   total: 10,
 *   paid: 0,
 *   date: '2026-08-01',
 *   weeklyFee: 5,
 *   status: 'Pendiente',
 *   type: 'Debtor'
 * });
 * // Si han pasado 14 días (2 semanas) -> weeksElapsed: 2, accruedCommission: 10, adjustedTotal: 20
 */
export function calculateDebtCommissions(debt: DebtCalculationInput): DebtCalculationResult {
  const principal = Math.max(0, debt.total || 0);
  const paid = Math.max(0, debt.paid || 0);
  const weeklyFee = Math.max(0, debt.weeklyFee || 0);
  const isDebtor = debt.type === 'Debtor' || debt.type === 'Deudor';

  // Si no es un deudor, o no tiene fecha o la comisión es <= 0, no aplica cálculo de recargos
  const startDateStr = debt.commissionStartDate || debt.date;

  if (!isDebtor || !startDateStr || weeklyFee <= 0) {
    const defaultSaldo = Math.max(0, principal - paid);
    return {
      weeksElapsed: 0,
      accruedCommission: 0,
      adjustedTotal: principal,
      saldoPendiente: defaultSaldo,
      isFrozen: false,
    };
  }

  // Parsear fecha inicial de forma segura
  const startDate = startDateStr.includes('T') ? parseISO(startDateStr) : new Date(startDateStr);
  if (isNaN(startDate.getTime())) {
    return {
      weeksElapsed: 0,
      accruedCommission: 0,
      adjustedTotal: principal,
      saldoPendiente: Math.max(0, principal - paid),
      isFrozen: false,
    };
  }

  // Determinar la fecha de corte:
  // Si la deuda está saldada ('Listo') o existe freezeDate, se congela el cómputo temporal a esa fecha.
  const isStatusListo = debt.status === 'Listo';
  const hasFreezeDate = Boolean(debt.freezeDate);
  const isFrozen = isStatusListo || hasFreezeDate;

  let cutoffDate: Date;
  if (hasFreezeDate && debt.freezeDate) {
    cutoffDate = debt.freezeDate.includes('T') ? parseISO(debt.freezeDate) : new Date(debt.freezeDate);
  } else if (isStatusListo) {
    cutoffDate = new Date(); // Si ya está listo y sin freezeDate, se asumirá fecha actual
  } else {
    cutoffDate = new Date();
  }

  if (isNaN(cutoffDate.getTime())) {
    cutoffDate = new Date();
  }

  // Calcular diferencia en días (no negativa)
  const diffDays = Math.max(0, differenceInDays(cutoffDate, startDate));
  const weeksElapsed = Math.floor(diffDays / 7);
  const accruedCommission = weeksElapsed * weeklyFee;
  const adjustedTotal = principal + accruedCommission;
  const saldoPendiente = Math.max(0, adjustedTotal - paid);

  return {
    weeksElapsed,
    accruedCommission,
    adjustedTotal,
    saldoPendiente,
    isFrozen,
  };
}
