// REFACTOR ME: Convert callback-based code to async/await

const fs = require("fs");
const https = require("https");

// Example 1: Nested callbacks for file operations
function processConfigFile(configPath, callback) {
  fs.readFile(configPath, "utf8", function (err, data) {
    if (err) {
      callback(err, null);
      return;
    }

    let config;
    try {
      config = JSON.parse(data);
    } catch (parseErr) {
      callback(parseErr, null);
      return;
    }

    fs.readFile(config.dataFile, "utf8", function (err, rawData) {
      if (err) {
        callback(err, null);
        return;
      }

      const processedData = rawData.toUpperCase();

      fs.writeFile(config.outputFile, processedData, function (err) {
        if (err) {
          callback(err, null);
          return;
        }

        fs.stat(config.outputFile, function (err, stats) {
          if (err) {
            callback(err, null);
            return;
          }

          callback(null, {
            success: true,
            outputFile: config.outputFile,
            size: stats.size,
          });
        });
      });
    });
  });
}

// Example 2: Promise chains (should use async/await)
function fetchUserData(userId) {
  return fetch(`https://api.example.com/users/${userId}`)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("User not found");
      }
      return response.json();
    })
    .then(function (user) {
      return fetch(`https://api.example.com/users/${userId}/orders`);
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (orders) {
      return fetch(`https://api.example.com/users/${userId}/preferences`);
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (preferences) {
      return {
        user: user, // Bug: user is not in scope
        orders: orders,
        preferences: preferences,
      };
    })
    .catch(function (error) {
      console.error("Error:", error);
      throw error;
    });
}

// Example 3: Event-based callbacks
function setupDatabaseConnection(config, callback) {
  const connection = createConnection(config);

  connection.on("connect", function () {
    console.log("Connected to database");

    connection.query("SELECT 1", function (err, result) {
      if (err) {
        callback(err, null);
        return;
      }

      connection.on("ready", function () {
        callback(null, connection);
      });
    });
  });

  connection.on("error", function (err) {
    callback(err, null);
  });

  connection.connect();
}

// Example 4: setTimeout callbacks
function delayedOperations(data, callback) {
  setTimeout(function () {
    const step1 = data + " - step 1";

    setTimeout(function () {
      const step2 = step1 + " - step 2";

      setTimeout(function () {
        const step3 = step2 + " - step 3";

        setTimeout(function () {
          const finalResult = step3 + " - complete";
          callback(null, finalResult);
        }, 100);
      }, 100);
    }, 100);
  }, 100);
}

// Example 5: Mixed callbacks and promises
function complexDataPipeline(inputFile, callback) {
  fs.readFile(inputFile, "utf8", function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    // Switch to promise
    fetch("https://api.example.com/process", {
      method: "POST",
      body: data,
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (result) {
        // Back to callback
        fs.writeFile("output.json", JSON.stringify(result), function (err) {
          if (err) {
            callback(err);
            return;
          }

          // Another promise
          fetch("https://api.example.com/notify", {
            method: "POST",
            body: JSON.stringify({ status: "complete" }),
          })
            .then(function () {
              callback(null, "Pipeline complete");
            })
            .catch(function (err) {
              callback(err);
            });
        });
      })
      .catch(function (err) {
        callback(err);
      });
  });
}

// Mock functions
function createConnection(config) {
  return {
    on: () => {},
    query: () => {},
    connect: () => {},
  };
}

module.exports = {
  processConfigFile,
  fetchUserData,
  setupDatabaseConnection,
  delayedOperations,
  complexDataPipeline,
};
