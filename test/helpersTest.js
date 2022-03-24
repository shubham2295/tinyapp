const {assert, expect} = require('chai');

const {getUserByEmail, urlsForUser, generateRandomString} = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user2RandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.ca",
    userID: "user2RandomID"
  },
  "9sm6xK": {
    longURL: "http://www.instagram.com",
    userID: "userRandomID"
  },
};

describe('#getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });
  it('should return "undefined" if there is no registered user with given email', function() {
    const user = getUserByEmail("test@example.com", testUsers);
    assert.equal(user, undefined);
  });
});

describe('#urlsForUser', function() {
  it('should return a filtered object with short and long url for user with valid user id', function() {
    const urls = urlsForUser("user2RandomID", testUrlDatabase);
    const expectedUrlsData = {
      "b2xVn2": "http://www.lighthouselabs.ca",
      "9sm5xK": "http://www.google.ca"
    };
    expect(urls).to.deep.equal(expectedUrlsData);
  });
  it('should return empty object if there are no short urls registered with given use id', function() {
    const urls = urlsForUser("RandomID", testUrlDatabase);
    expect(urls).to.deep.equal({});
  });
});

describe('#generateRandomString', function() {
  it('should return alphanumeric string with length of 6 charachter', function() {
    const output = generateRandomString();
    assert.equal(typeof (output), 'string');
    assert.equal(output.length, 6);
  });
});