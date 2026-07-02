export const money = (n: number | string | null | undefined) => {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return `$${(v || 0).toFixed(2)}`;
};

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
