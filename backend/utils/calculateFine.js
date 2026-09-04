import { ENV } from '../config/env.js';

/**
 * Calculates overdue fine based on dueDate, returnDate, and membership plan fine rates.
 * Formula per spec: overdueDays = max(0, returnDate - dueDate)
 * Example: Due Sept 1, Return Sept 5 -> 4 days overdue
 * @param {Date} dueDate 
 * @param {Date} returnDate 
 * @param {number} finePerDay 
 * @param {number} maxFine 
 * @returns {{ overdueDays: number, fine: number }}
 */
export const calculateFine = (
  dueDate,
  returnDate = new Date(),
  finePerDay = ENV.FINE_DEFAULT_RATE,
  maxFine = ENV.MAX_FINE_AMOUNT
) => {
  const due = new Date(dueDate).getTime();
  const returned = new Date(returnDate).getTime();

  if (returned <= due) {
    return { overdueDays: 0, fine: 0 };
  }

  const diffMs = returned - due;
  const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const rate = Number(finePerDay) > 0 ? Number(finePerDay) : ENV.FINE_DEFAULT_RATE;
  let calculatedFine = overdueDays * rate;

  if (maxFine && Number(maxFine) > 0) {
    calculatedFine = Math.min(calculatedFine, Number(maxFine));
  }

  return {
    overdueDays,
    fine: calculatedFine
  };
};
