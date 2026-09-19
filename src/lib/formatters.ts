/**
 * Global Currency and Number Formatting Utility for Indian Rupees (₹)
 * Adheres strictly to the Indian Numbering System (en-IN) and INR currency code.
 */

export const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Standard global currency formatter rendering ₹ with Indian comma grouping
 * e.g., 150000 => "₹1,50,000.00"
 */
export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null) {
    return inrFormatter.format(0);
  }
  const numericVal = typeof value === "number" ? value : parseFloat(value.toString());
  if (isNaN(numericVal)) {
    return inrFormatter.format(0);
  }
  return inrFormatter.format(numericVal);
}

/**
 * Clean Rupee tick and label formatter without unnecessary decimals
 * Ideal for Recharts axes and compact stat counters
 * e.g., 50000 => "₹50,000"
 */
export function formatRupeeTick(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "₹0";
  const num = typeof value === "number" ? value : parseFloat(value.toString());
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
}
