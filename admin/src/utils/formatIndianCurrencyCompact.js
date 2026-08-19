/**
 * Indian currency formatter
 *
 * Rules:
 * - Below 1 Lakh -> Indian comma format (12,500)
 * - 1 Lakh to < 1 Crore -> Lakh format (5.20 L)
 * - ≥ 1 Crore -> Crore format (1.44 Cr)
 *
 * @param {number|string} value
 * @param {object} options
 * @param {number} options.decimals
 * @param {boolean} options.showSymbol
 * @returns {string}
 */

export const formatIndianCurrencyCompact = (
  value,
  { decimals = 2, showSymbol = false } = {}
) => {
  if (value === null || value === undefined || value === "" || isNaN(value)) {
    return showSymbol ? "₹ 0" : "0";
  }

  const num = Number(value);
  const symbol = showSymbol ? "₹ " : "";

  // Crore
  if (num >= 1_00_00_000) {
    return `${symbol}${(num / 1_00_00_000).toFixed(decimals)} Cr`;
  }

  // Lakh
  if (num >= 1_00_000) {
    return `${symbol}${(num / 1_00_000).toFixed(decimals)} L`;
  }

  // Below Lakh -> Indian comma format
  return `${symbol}${new Intl.NumberFormat("en-IN").format(num)}`;
};
