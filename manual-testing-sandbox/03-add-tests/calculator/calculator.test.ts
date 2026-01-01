// TEST FILE: Partial tests - AI should generate more comprehensive coverage

import { Calculator } from "./calculator";

describe("Calculator", () => {
  let calc: Calculator;

  beforeEach(() => {
    calc = new Calculator();
  });

  describe("basic operations", () => {
    test("should add numbers", () => {
      expect(calc.add(5).getResult()).toBe(5);
    });

    test("should subtract numbers", () => {
      expect(calc.add(10).subtract(3).getResult()).toBe(7);
    });

    // TODO: Add tests for multiply
    // TODO: Add tests for divide
  });

  describe("division", () => {
    test("should throw when dividing by zero", () => {
      expect(() => calc.divide(0)).toThrow("Cannot divide by zero");
    });

    // TODO: Add more division tests
  });

  // TODO: Add tests for:
  // - power()
  // - sqrt()
  // - modulo()
  // - negate()
  // - abs()
  // - round()
  // - getHistory()
  // - reset()
  // - undo()
  // - chained operations
  // - edge cases (negative numbers, decimals, very large numbers)
  // - initial value in constructor
});
