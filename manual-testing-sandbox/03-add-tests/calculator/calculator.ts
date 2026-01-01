// Calculator implementation - needs comprehensive test coverage

export class Calculator {
  private result: number = 0;
  private history: Array<{ operation: string; value: number; result: number }> =
    [];

  constructor(initialValue: number = 0) {
    this.result = initialValue;
  }

  add(value: number): Calculator {
    const previousResult = this.result;
    this.result += value;
    this.history.push({ operation: "add", value, result: this.result });
    return this;
  }

  subtract(value: number): Calculator {
    this.result -= value;
    this.history.push({ operation: "subtract", value, result: this.result });
    return this;
  }

  multiply(value: number): Calculator {
    this.result *= value;
    this.history.push({ operation: "multiply", value, result: this.result });
    return this;
  }

  divide(value: number): Calculator {
    if (value === 0) {
      throw new Error("Cannot divide by zero");
    }
    this.result /= value;
    this.history.push({ operation: "divide", value, result: this.result });
    return this;
  }

  power(exponent: number): Calculator {
    this.result = Math.pow(this.result, exponent);
    this.history.push({
      operation: "power",
      value: exponent,
      result: this.result,
    });
    return this;
  }

  sqrt(): Calculator {
    if (this.result < 0) {
      throw new Error("Cannot calculate square root of negative number");
    }
    this.result = Math.sqrt(this.result);
    this.history.push({ operation: "sqrt", value: 0, result: this.result });
    return this;
  }

  modulo(value: number): Calculator {
    if (value === 0) {
      throw new Error("Cannot perform modulo by zero");
    }
    this.result %= value;
    this.history.push({ operation: "modulo", value, result: this.result });
    return this;
  }

  negate(): Calculator {
    this.result = -this.result;
    this.history.push({ operation: "negate", value: 0, result: this.result });
    return this;
  }

  abs(): Calculator {
    this.result = Math.abs(this.result);
    this.history.push({ operation: "abs", value: 0, result: this.result });
    return this;
  }

  round(decimals: number = 0): Calculator {
    const multiplier = Math.pow(10, decimals);
    this.result = Math.round(this.result * multiplier) / multiplier;
    this.history.push({
      operation: "round",
      value: decimals,
      result: this.result,
    });
    return this;
  }

  getResult(): number {
    return this.result;
  }

  getHistory(): Array<{ operation: string; value: number; result: number }> {
    return [...this.history];
  }

  reset(): Calculator {
    this.result = 0;
    this.history = [];
    return this;
  }

  undo(): Calculator {
    if (this.history.length > 1) {
      this.history.pop();
      this.result = this.history[this.history.length - 1].result;
    } else if (this.history.length === 1) {
      this.history.pop();
      this.result = 0;
    }
    return this;
  }
}
