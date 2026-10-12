// Client-safe formatting utilities.
export function fmtZAR(n: number) {
  return (
    "R " +
    (n / 100 >= 1 ? n / 100 : n).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Format a ZAR value already in rands (not cents).
export function fmtRands(n: number) {
  return "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
