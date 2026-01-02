pub fn max(a: i32, b: i32) -> i32 {
    if a >= b { a } else { b }
}

mod tests {
    use super::*;

    #[test]
    fn returns_greater_of_two_numbers() {
        assert_eq!(max(3, 2), 3);
    }

    #[test]
    fn works_with_negative_numbers() {
        assert_eq!(max(-1, -2), -1);
    }

    #[test]
    fn returns_same_value_when_equal() {
        assert_eq!(max(5, 5), 5);
    }
}