// BUG FILE: Intentional JavaScript errors for testing

// BUG 1: Undefined variable usage
function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * quantity; // 'quantity' is not defined
  }
  return totl; // Typo: 'totl' instead of 'total'
}

// BUG 2: Using undeclared variables
function processData(data) {
  result = data.map((x) => x * 2); // 'result' not declared (implicit global)
  temp = result.filter((x) => x > 10); // 'temp' not declared
  return temp;
}

// BUG 3: Variable shadowing issues
let count = 0;
function incrementCounter() {
  let count = count + 1; // References undefined inner 'count'
  return count;
}

// BUG 4: Accessing properties on undefined
function getUserEmail(response) {
  const email = response.data.user.email; // Chain could fail
  return email;
}

// BUG 5: Wrong variable scope
function createCounters() {
  const counters = [];
  for (var i = 0; i < 5; i++) {
    // Using 'var' - all closures share same 'i'
    counters.push(function () {
      return i;
    });
  }
  return counters; // All return 5
}

// BUG 6: Misspelled property names
const config = {
  apiEndpoint: "https://api.example.com",
  maxRetries: 3,
  timeout: 5000,
};

function fetchData() {
  const url = config.apiEnpoint; // Typo: 'apiEnpoint'
  const retries = config.maxRetires; // Typo: 'maxRetires'
  console.log(url, retries);
}

// BUG 7: Incorrect this binding
const user = {
  name: "Alice",
  greet: function () {
    setTimeout(function () {
      console.log("Hello, " + this.name); // 'this' is wrong context
    }, 100);
  },
};

// BUG 8: Missing return statement
function findMax(numbers) {
  if (numbers.length === 0) {
    // Missing return - returns undefined
  }
  let max = numbers[0];
  for (const num of numbers) {
    if (num > max) max = num;
  }
  return max;
}

// BUG 9: Comparing with wrong type
function checkStatus(status) {
  if (status == "200") {
    // Loose equality with string
    return "OK";
  } else if (status === 200) {
    // Strict equality with number
    return "OK";
  }
  return "Error";
}

// BUG 10: Using const then reassigning
function updateValue() {
  const value = 10;
  value = 20; // Error: Assignment to constant
  return value;
}

// BUG 11: Hoisting confusion
function hoistingExample() {
  console.log(myVar); // undefined due to hoisting
  console.log(myLet); // ReferenceError: can't access before init
  var myVar = "var variable";
  let myLet = "let variable";
}

// BUG 12: Array method on wrong type
function processInput(input) {
  return input.map((x) => x.toUpperCase()); // input might not be array
}
