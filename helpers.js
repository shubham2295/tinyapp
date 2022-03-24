const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

const getUserByEmail = function(email, database) {
  for (const user in database) {
    for (const value in database[user]) {
      if (database[user][value] === email) {
        return database[user];
      }
    }
  }
  return undefined;
};

const urlsForUser = function(userId, database) {
  let result = {};
  for (const url in database) {
    if (database[url].userID === userId) {
      result[url] = {longURL: database[url].longURL, totalVisits: database[url].totalVisits};
    }
  }
  return result;
};

const createErrorObject = function(userObject, errorCode, errorMessage) {
  return {user: userObject, errorCode, errorMessage};
};

module.exports = {generateRandomString, getUserByEmail, urlsForUser, createErrorObject};