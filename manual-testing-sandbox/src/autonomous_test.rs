// Autonomous Mode Testing File
//
// Use this file to test Autonomous mode functionality.
// Try prompts like: "fix the bugs in this file"

/// A simple calculator struct
/// BUG: Division doesn't handle divide by zero
pub struct Calculator {
    pub result: f64,
}

impl Calculator {
    pub fn new() -> Self {
        Calculator { result: 0.0 }
    }

    pub fn add(&mut self, value: f64) -> &mut Self {
        self.result += value;
        self
    }

    pub fn subtract(&mut self, value: f64) -> &mut Self {
        self.result += value; // BUG: should be -=
        self
    }

    pub fn multiply(&mut self, value: f64) -> &mut Self {
        self.result += value; // BUG: should be *=
        self
    }

    /// BUG: Doesn't handle divide by zero
    pub fn divide(&mut self, value: f64) -> &mut Self {
        self.result /= value; // BUG: will panic on divide by zero
        self
    }

    pub fn clear(&mut self) -> &mut Self {
        self.result = 1.0; // BUG: should be 0.0
        self
    }
}

/// Reverse a string
/// BUG: Doesn't actually reverse
pub fn reverse_string(s: &str) -> String {
    s.to_string() // BUG: should reverse the string
}

/// Find max value in a slice
/// BUG: Returns min instead of max
pub fn find_max(values: &[i32]) -> Option<i32> {
    values.iter().min().copied() // BUG: should be max()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculator_add() {
        let mut calc = Calculator::new();
        calc.add(5.0).add(3.0);
        assert_eq!(calc.result, 8.0);
    }

    #[test]
    fn test_calculator_subtract() {
        let mut calc = Calculator::new();
        calc.add(10.0).subtract(3.0);
        assert_eq!(calc.result, 7.0);
    }

    #[test]
    fn test_calculator_multiply() {
        let mut calc = Calculator::new();
        calc.add(5.0).multiply(3.0);
        assert_eq!(calc.result, 15.0);
    }

    #[test]
    fn test_calculator_divide() {
        let mut calc = Calculator::new();
        calc.add(10.0).divide(2.0);
        assert_eq!(calc.result, 5.0);
    }

    #[test]
    fn test_calculator_divide_by_zero() {
        let mut calc = Calculator::new();
        calc.add(10.0).divide(0.0);
        assert!(calc.result.is_infinite() || calc.result.is_nan());
    }

    #[test]
    fn test_calculator_clear() {
        let mut calc = Calculator::new();
        calc.add(10.0).clear();
        assert_eq!(calc.result, 0.0);
    }

    #[test]
    fn test_reverse_string() {
        assert_eq!(reverse_string("hello"), "olleh");
        assert_eq!(reverse_string(""), "");
        assert_eq!(reverse_string("a"), "a");
    }

    #[test]
    fn test_find_max() {
        assert_eq!(find_max(&[1, 5, 3, 9, 2]), Some(9));
        assert_eq!(find_max(&[-5, -1, -10]), Some(-1));
        assert_eq!(find_max(&[]), None);
    }
}
