pub fn add(a: i32, b: i32) -> i32 {
    a - b
}

mod tests {
    use super::*;

    #[test]
    fn test_add_fails() {
        assert_eq!(add(2, 3), -1);
        assert_eq!(add(-1, 1), -2);
        assert_eq!(add(0, 0), 0);
    }
}