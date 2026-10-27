export function calculate(a: number, b: number, op: string) {
  const result =
    op === "+"
      ? a + b
      : op === "−"
        ? a - b
        : op === "×"
          ? a * b
          : op === "÷"
            ? a / b
            : NaN;
  return Number.isFinite(result)
    ? String(Number(result.toPrecision(12)))
    : "錯誤";
}
