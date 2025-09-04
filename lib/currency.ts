// Philippine Peso currency formatting
export const CURRENCY_SYMBOL = "₱"
export const CURRENCY_CODE = "PHP"
export const CURRENCY_NAME = "Philippine Peso"

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function parseCurrency(value: string): number {
  return Number.parseFloat(value.replace(/[^\d.-]/g, "")) || 0
}
