fn double_borrow() {
    let mut data = vec![1, 2, 3];
    let first = &mut data[0];
    let second = &mut data[1];
    *first += *second;
}

fn mixed_borrow() {
    let mut items = vec![1, 2, 3, 4, 5];
    let first = &items[0];
    items.push(6);
    println!("{}", first);
}

fn use_after_move() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s1);
}

fn return_local_ref() -> &String {
    let s = String::from("hello");
    &s
}

fn iterator_invalidation() {
    let mut numbers = vec![1, 2, 3, 4, 5];
    for n in &numbers {
        if *n == 3 {
            numbers.push(6);
        }
    }
}

struct Container<'a> {
    data: &'a str,
}

fn create_dangling() -> Container<'static> {
    let s = String::from("temporary");
    Container { data: &s }
}

fn loop_borrow() {
    let mut data = vec![1, 2, 3];
    let mut sum = 0;
    for item in data.iter() {
        sum += *item;
        data.push(*item);
    }
}

fn match_borrow() {
    let mut opt = Some(String::from("hello"));
    match &opt {
        Some(s) => {
            opt = None;
            println!("{}", s);
        }
        None => {}
    }
}

fn move_from_borrow() {
    let v = vec![String::from("hello")];
    let r = &v;
    let s = r[0];
}

fn lifetime_mismatch<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

struct SelfRef {
    data: String,
    reference: &str,
}

fn mutable_aliasing() {
    let mut x = 5;
    let y = &mut x;
    let z = &mut x;
    *y = 10;
    *z = 20;
}

    *y += 1;
    *z += 1;
}

fn main() {
    // These would all fail to compile
}
