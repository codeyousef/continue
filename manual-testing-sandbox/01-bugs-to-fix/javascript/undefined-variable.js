function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity; // 'quantity' is not defined
  }
  return total; // Typo: 'totl' instead of 'total'
}

function processData(data) {
  result = data.map((x) => x * 2); // 'result' not declared (implicit global)
  temp = result.filter((x) => x > 10); // 'temp' not declared
  return temp;
}

let count = 0;
function incrementCounter() {
  count = count + 1; // References undefined inner 'count'
  return count;
}

function getUserEmail(response) {
  const email = response?.data?.user?.email; // Chain could fail
  return email;
}

function createCounters() {
  const counters = [];
  for (var i = 0; i < 5; i++) {
    counters.push(function () {
      return i;
    });
  }
  return counters;
}

const config = {
  apiEndpoint: "https://api.example.com",
  maxRetries: 3,
  timeout: 5000,
};

function fetchData() {
  const url = config.apiEndpoint;
  const retries = config.maxRetries;
  console.log(url, retries);
}

const user = {
  name: "Alice",
  greet: function () {
    setTimeout(() => {}, 100);
  },
};

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

function checkStatus(status) {
  if (status == "200") {
    return "OK";
  } else if (status === 200) {
    return "OK";
  }
  return "Error";
}

function updateValue() {
  let value = 10;
  value = 20;
  return value;
}

function hoistingExample() {
  const myVar = "var variable";
  let myLet = "let variable";
  console.log(myLet);
}

function processInput(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.map((x) => x.toUpperCase());
}
