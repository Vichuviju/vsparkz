/**
 * Format number using Indian numbering system
 * Example:
 * 12500      → 12,500
 * 14364715   → 1,43,64,715
 *
 * @param {number|string} value
 * @returns {string}
 */

export const formatIndianCurrency = (value, digits = 0) => {
  if (value === undefined || value === null || isNaN(value)) return "₹ 0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value));
};
