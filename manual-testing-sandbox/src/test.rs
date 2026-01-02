pub fn add_two_numbers(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_two_numbers() {
        assert_eq!(add_two_numbers(2, 3), 5);
        assert_eq!(add_two_numbers(-1, 1), 0);
        assert_eq!(add_two_numbers(0, 0), 0);
    }
}