// BUG FILE: Callback hell for refactoring to async/await

const fs = require("fs");
const https = require("https");

// BUG: Deeply nested callbacks - "Pyramid of Doom"
function processUserData(userId, callback) {
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
          ordersRes.on("end", () => {
            const orders = JSON.parse(ordersData);

            // Level 3: Fetch details for each order
            let completedOrders = 0;
            const orderDetails = [];

            orders.forEach((order, index) => {
              https.get(
                `https://api.example.com/orders/${order.id}`,
                (detailRes) => {
                  let detailData = "";
                  detailRes.on("data", (chunk) => {
                    detailData += chunk;
                  });
                  detailRes.on("end", () => {
                    orderDetails[index] = JSON.parse(detailData);
                    completedOrders++;

                    // Level 4: When all done, save to file
                    if (completedOrders === orders.length) {
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
                    }
                  });
                },
              );
            });
          });
        },
      );
    });
  });
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
function connectToDatabase(config, cb) {
  setTimeout(() => cb(null, { connected: true }), 100);
}
function createTables(conn, cb) {
  setTimeout(() => cb(null), 100);
}
function seedInitialData(conn, cb) {
  setTimeout(() => cb(null), 100);
}
function createIndexes(conn, cb) {
  setTimeout(() => cb(null), 100);
}
function verifySetup(conn, cb) {
  setTimeout(() => cb(null), 100);
}

// Event handler callback hell
function setupEventListeners(element, callback) {
  element.addEventListener("click", (e) => {
    validateClick(e, (err, isValid) => {
      if (!err && isValid) {
        fetchData(e.target.dataset.id, (err, data) => {
          if (!err) {
            processData(data, (err, result) => {
              if (!err) {
                updateUI(result, (err) => {
                  if (!err) {
                    saveState(result, (err) => {
                      if (!err) {
                        callback(null, "Success");
                      } else {
                        callback(err);
                      }
                    });
                  } else {
                    callback(err);
                  }
                });
              } else {
                callback(err);
              }
            });
          } else {
            callback(err);
          }
        });
      }
    });
  });
}

// Mock functions
function validateClick(e, cb) {
  cb(null, true);
}
function fetchData(id, cb) {
  cb(null, { id });
}
function processData(data, cb) {
  cb(null, data);
}
function updateUI(data, cb) {
  cb(null);
}
function saveState(data, cb) {
  cb(null);
}
