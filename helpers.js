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
      result[url] = { longURL: database[url].longURL, totalVisits: database[url].totalVisits };
    }
  }
  return result;
};

const createErrorObject = function(userObject, errorCode, errorMessage) {
  return { user: userObject, errorCode, errorMessage };
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: "dishwasher-funk"
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "abc@xyz.com",
    hashedPassword: "$2a$10$leC5Ic51JIohQIVXpW9XbuZiNrffCBiBz7N7dw2EBgWYggwWJdgaC"
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user3RandomID",
    totalVisits: 0,
    visits: {},
    uniqueVisitors: []
  },
  "9sm5xK": {
    longURL: "http://www.google.ca",
    userID: "user3RandomID",
    totalVisits: 0,
    visits: {},
    uniqueVisitors: []
  },
  "111111": {
    longURL: "http://www.instagram.com",
    userID: "userRandomID",
    totalVisits: 0,
    visits: {},
    uniqueVisitors: []
  },
};


module.exports = { generateRandomString, getUserByEmail, urlsForUser, createErrorObject, users, urlDatabase };