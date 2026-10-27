import { it, expect } from "vitest";
import { calculate } from "./calculatorMath";
it("calculates safely without evaluating source text", () => {
  expect(calculate(0.1, 0.2, "+")).toBe("0.3");
  expect(calculate(9, 3, "÷")).toBe("3");
  expect(calculate(9, 0, "÷")).toBe("錯誤");
  expect(calculate(1, 2, "script")).toBe("錯誤");
});
