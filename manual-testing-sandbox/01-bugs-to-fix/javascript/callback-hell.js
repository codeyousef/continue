// BUG FILE: Callback hell for refactoring to async/await

const fs = require("fs");
const https = require("https");

// Helper function to wrap https.get in a Promise
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
        res.on("error", (err) => {
          reject(err);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// BUG: Deeply nested callbacks - "Pyramid of Doom"
function processUserData(userId, callback) {
  try {
    // Level 1: Fetch user
    https.get(`https://api.example.com/users/${userId}`, (userRes) => {
      let userData = "";
      userRes.on("data", (chunk) => {
        userData += chunk;
      });
      userRes.on("end", () => {
        const user = JSON.parse(userData);

        // Level 2: Fetch user's orders
        https.get(
          `https://api.example.com/users/${userId}/orders`,
          (ordersRes) => {
            let ordersData = "";
            ordersRes.on("data", (chunk) => {
              ordersData += chunk;
            });
            ordersRes.on("end", async () => {
              const orders = JSON.parse(ordersData);

              // Level 3: Fetch details for each order in parallel
              const orderDetails = await Promise.all(
                orders.map((order) =>
                  httpsGet(`https://api.example.com/orders/${order.id}`),
                ),
              );

              // Level 4: When all done, save to file
              const result = {
                user: user,
                orders: orderDetails,
              };

              fs.writeFile(
                `user_${userId}_data.json`,
                JSON.stringify(result, null, 2),
                (writeErr) => {
                  if (writeErr) {
                    callback(writeErr, null);
                  } else {
                    // Level 5: Read it back to verify
                    fs.readFile(
                      `user_${userId}_data.json`,
                      "utf8",
                      (readErr, data) => {
                        if (readErr) {
                          callback(readErr, null);
                        } else {
                          callback(null, JSON.parse(data));
                        }
                      },
                    );
                  }
                },
              );
            });
          },
        );
      });
    });
  } catch (error) {
    callback(error, null);
  }
}

// Another callback hell example: Sequential operations
function initializeDatabase(config, callback) {
  connectToDatabase(config, (err, connection) => {
    if (err) return callback(err);

    createTables(connection, (err) => {
      if (err) return callback(err);

      seedInitialData(connection, (err) => {
        if (err) return callback(err);

        createIndexes(connection, (err) => {
          if (err) return callback(err);

          verifySetup(connection, (err) => {
            if (err) return callback(err);

            callback(null, connection);
          });
        });
      });
    });
  });
}

// Mock functions for the above
function connectToDatabase(config, callback) {
  setTimeout(() => callback(null, { connected: true }), 100);
}

function createTables(connection, callback) {
  setTimeout(() => callback(null), 100);
}

function seedInitialData(connection, callback) {
  setTimeout(() => callback(null), 100);
}

function createIndexes(connection, callback) {
  setTimeout(() => callback(null), 100);
}

function verifySetup(connection, callback) {
  setTimeout(() => callback(null), 100);
}

// Usage example:
// Using .catch() for error handling
processUserData(123, (err, data) => {
  if (err) {
    console.error("Error processing user data:", err);
  } else {
    console.log("User data processed successfully:", data);
  }
});

// Or if processUserData is refactored to async/await, use try-catch:
/*
async function main() {
  try {
    const data = await processUserData(123);
    console.log('User data processed successfully:', data);
  } catch (err) {
    console.error('Error processing user data:', err);
  }
}

main();
*/
