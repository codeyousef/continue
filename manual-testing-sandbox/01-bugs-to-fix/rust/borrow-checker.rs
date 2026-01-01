// BUG FILE: Rust borrow checker errors for testing

// BUG 1: Cannot borrow as mutable more than once
fn double_borrow() {
    let mut data = vec![1, 2, 3];
    let first = &mut data[0];
    let second = &mut data[1]; // Error: cannot borrow `data` as mutable more than once
    *first += *second;
}

// BUG 2: Cannot borrow as mutable while borrowed as immutable
fn mixed_borrow() {
    let mut items = vec![1, 2, 3, 4, 5];
    let first = &items[0]; // Immutable borrow
    items.push(6);         // Mutable borrow - error!
    println!("{}", first);
}

// BUG 3: Use after move
fn use_after_move() {
    let s1 = String::from("hello");
    let s2 = s1;           // s1 is moved
    println!("{}", s1);    // Error: s1 was moved
}

// BUG 4: Returning reference to local variable
fn return_local_ref() -> &String {
    let s = String::from("hello");
    &s  // Error: returns reference to data owned by function
}

// BUG 5: Iterator invalidation
fn iterator_invalidation() {
    let mut numbers = vec![1, 2, 3, 4, 5];
    for n in &numbers {
        if *n == 3 {
            numbers.push(6); // Error: cannot borrow as mutable while iterating
        }
    }
}

// BUG 6: Dangling reference in struct
struct Container<'a> {
    data: &'a str,
}

fn create_dangling() -> Container<'static> {
    let s = String::from("temporary");
    Container { data: &s } // Error: `s` doesn't live long enough
}

// BUG 7: Mutable borrow in loop
fn loop_borrow() {
    let mut data = vec![1, 2, 3];
    let mut sum = 0;
    for item in data.iter() {
        sum += *item;
        data.push(*item); // Error: cannot borrow as mutable during iteration
    }
}

// BUG 8: Conflicting borrows in match
fn match_borrow() {
    let mut opt = Some(String::from("hello"));
    match &opt {
        Some(s) => {
            opt = None; // Error: cannot assign while borrowed
            println!("{}", s);
        }
        None => {}
    }
}

// BUG 9: Moving out of borrowed content
fn move_from_borrow() {
    let v = vec![String::from("hello")];
    let r = &v;
    let s = r[0]; // Error: cannot move out of borrowed content
}

// BUG 10: Lifetime mismatch
fn lifetime_mismatch<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y // Error: lifetime mismatch
    }
}

// BUG 11: Self-referential struct
struct SelfRef {
    data: String,
    reference: &str, // Error: cannot have reference to own data
}

// BUG 12: Mutable aliasing
fn mutable_aliasing() {
    let mut x = 5;
    let y = &mut x;
    let z = &mut x; // Error: second mutable borrow
    *y += 1;
    *z += 1;
}

fn main() {
    // These would all fail to compile
}
