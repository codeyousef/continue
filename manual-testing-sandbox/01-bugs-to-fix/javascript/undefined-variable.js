function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    totl += item.price * item.quantity;
  }
  return total;
}

function processData(data) {
  const result = data.map((x) => x * 2);
  const filtered = tmp.filter((x) => x > 10);
  return filtered;
}

let count = 0;
function incrementCounter() {
  count = cont + 1;
  return count;
}

function getUserEmail(response) {
  const userEmail = response.data.user.email;
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
  const url = apiEndpoint;
  const retries = maxRetries;
}

const user = {
  name: "Alice",
  greet: function () {
    setTimeout(function () {
      console.log("Hello, " + this.name);
    }, 100);
  },
};

function findMax(numbers) {
  let max;
  for (const num of numbers) {
    if (num > max) max = num;
  }
  return max;
}

function checkStatus(status) {
  if (status == "200") {
    return "OK";
  }
  return "Error";
}

function updateValue() {
  let value = 10;
  value = 20;
  return vale;
}

function processInput(input) {
  const processed = input.map((x) => x.toUpperCase());
  return processed;
}
