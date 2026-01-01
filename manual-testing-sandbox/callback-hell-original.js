// callback-hell-original.js
// Original buggy callback hell code for reference and comparison

// Simulated async database/API functions
function fetchUser(userId, callback) {
  setTimeout(() => {
    if (userId < 1) {
      callback(new Error("Invalid user ID"));
      return;
    }
    callback(null, {
      id: userId,
      name: "User" + userId,
      email: "user" + userId + "@example.com",
    });
  }, 100);
}

function fetchPosts(userId, callback) {
  setTimeout(() => {
    if (userId < 1) {
      callback(new Error("Invalid user ID for posts"));
      return;
    }
    callback(null, [
      { id: 1, userId: userId, title: "Post 1", content: "Content 1" },
      { id: 2, userId: userId, title: "Post 2", content: "Content 2" },
    ]);
  }, 100);
}

function fetchComments(postId, callback) {
  setTimeout(() => {
    if (postId < 1) {
      callback(new Error("Invalid post ID"));
      return;
    }
    callback(null, [
      { id: 1, postId: postId, text: "Comment 1" },
      { id: 2, postId: postId, text: "Comment 2" },
    ]);
  }, 100);
}

function saveToDatabase(data, callback) {
  setTimeout(() => {
    if (!data) {
      callback(new Error("No data to save"));
      return;
    }
    callback(null, { success: true, timestamp: Date.now() });
  }, 100);
}

// BUG 1: Missing error handling in nested callbacks
// BUG 2: Variable scope issues - 'posts' and 'allComments' not accessible in outer scope
// BUG 3: Race condition - not waiting for all comments before proceeding
// BUG 4: Callback might be called multiple times in error cases
// BUG 5: Error in one comment fetch doesn't stop processing
function processUserData(userId, callback) {
  fetchUser(userId, function (err, user) {
    if (err) {
      callback(err);
      // BUG: Forgot to return, execution continues
    }

    fetchPosts(user.id, function (err, posts) {
      // BUG: No error check here
      var allComments = [];
      var processedPosts = 0;

      for (var i = 0; i < posts.length; i++) {
        var post = posts[i];

        fetchComments(post.id, function (err, comments) {
          // BUG: Variable 'post' has closure issue - always references last post
          // BUG: No error handling
          post.comments = comments;
          processedPosts++;

          // BUG: Race condition - might save before all comments fetched
          if (processedPosts === posts.length) {
            var processedData = {
              user: user,
              posts: posts,
            };

            saveToDatabase(processedData, function (err, result) {
              // BUG: No error check
              callback(null, processedData);
            });
          }
        });
      }

      // BUG: If posts array is empty, callback never called
    });
  });
}

// BUG 6: Multiple operations in parallel without coordination
// BUG 7: No way to cancel operations if one fails
function processMultipleUsers(userIds, callback) {
  var results = [];
  var completed = 0;
  var hasError = false;

  for (var i = 0; i < userIds.length; i++) {
    processUserData(userIds[i], function (err, data) {
      if (err && !hasError) {
        hasError = true;
        callback(err);
        // BUG: Other operations continue even after error
      }

      results.push(data);
      completed++;

      if (completed === userIds.length) {
        // BUG: Might call callback after error already reported
        callback(null, results);
      }
    });
  }

  // BUG: If userIds is empty, callback never called
}

// BUG 8: Pyramid of doom with deeply nested callbacks
// BUG 9: Difficult to maintain and reason about control flow
function complexWorkflow(userId, callback) {
  fetchUser(userId, function (err, user) {
    if (err) return callback(err);

    fetchPosts(user.id, function (err, posts) {
      if (err) {
        callback(err);
        // BUG: Forgot return statement
      }

      if (posts.length === 0) {
        callback(null, { user: user, posts: [] });
      }

      var firstPost = posts[0];
      fetchComments(firstPost.id, function (err, comments) {
        if (err) return callback(err);

        firstPost.comments = comments;

        saveToDatabase({ user: user, post: firstPost }, function (err, result) {
          if (err) return callback(err);

          // BUG: Different data structure returned than expected
          callback(null, result);
        });
      });
    });
  });
}

// Demonstration function showing all the bugs
function demonstrateBugs() {
  console.log("=== Demonstrating Callback Hell Bugs ===\n");

  console.log("1. Processing user with ID 1 (has bugs):");
  processUserData(1, function (err, data) {
    if (err) {
      console.log("Error:", err.message);
    } else {
      console.log(
        "Success (but might have silent bugs):",
        JSON.stringify(data, null, 2),
      );
    }
  });

  setTimeout(function () {
    console.log("\n2. Processing invalid user (error handling bug):");
    processUserData(-1, function (err, data) {
      if (err) {
        console.log("Error caught:", err.message);
      } else {
        console.log("Data:", data);
      }
    });
  }, 500);

  setTimeout(function () {
    console.log("\n3. Processing multiple users (coordination bugs):");
    processMultipleUsers([1, 2, 3], function (err, results) {
      if (err) {
        console.log("Error:", err.message);
      } else {
        console.log("Results count:", results.length);
      }
    });
  }, 1000);

  setTimeout(function () {
    console.log("\n4. Complex workflow (nested callback hell):");
    complexWorkflow(1, function (err, result) {
      if (err) {
        console.log("Error:", err.message);
      } else {
        console.log("Result:", JSON.stringify(result, null, 2));
      }
    });
  }, 1500);
}

module.exports = {
  fetchUser: fetchUser,
  fetchPosts: fetchPosts,
  fetchComments: fetchComments,
  saveToDatabase: saveToDatabase,
  processUserData: processUserData,
  processMultipleUsers: processMultipleUsers,
  complexWorkflow: complexWorkflow,
  demonstrateBugs: demonstrateBugs,
};

if (require.main === module) {
  demonstrateBugs();
}
