/** Money is stored as integer paise in the DB to avoid float rounding bugs. */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function formatRupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paiseToRupees(paise));
}
