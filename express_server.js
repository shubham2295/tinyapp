const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const PORT = 8080; //default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieParser());
app.set('view engine', 'ejs');

const users = {
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

const userSearch = function(email) {
  for (const user in users) {
    for (const value in users[user]) {
      if (users[user][value] === email) {
        return users[user];
      }
    }
  }
  return false;
};

app.route('/login').get((req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render('login', templateVars);
}).post((req, res) => {

  const email = req.body.email;
  const pwd = req.body.password;
  const user = userSearch(email);

  if (!user) {
    return res.status(403).send('User not found. Please check email or register.');
  } else if (pwd !== user.password) {
    return res.status(403).send('Incorrect password. Please try again with correct password.');
  } else {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  }

});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.route('/urls')
  .get((req, res) => {
    const templateVars = {urls: urlDatabase, user: users[req.cookies['user_id']]};
    res.render('urls_index', templateVars);
  })
  .post((req, res) => {
    const randomShortUrl = generateRandomString();
    urlDatabase[randomShortUrl] = req.body.longURL;
    res.redirect(`/urls/${randomShortUrl}`);
  });

app.get('/urls/new', (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.route('/register').get((req, res) => {
  const templateVars = {users, user: users[req.cookies['user_id']]};
  res.render('user_registration', templateVars);
}).post((req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  if (userEmail === "" || userPassword === "") {
    res.status(400).send('Email or Password field can\'t be blank. Please enter valid details.');
    return;
  }

  if (typeof (userSearch(userEmail)) === 'object') {
    res.status(400).send('Email already exists please register with another email address.');
    return;
  }

  const userID = generateRandomString();
  users[userID] = {};
  users[userID].id = userID;
  users[userID].email = userEmail;
  users[userID].password = userPassword;
  res.cookie('user_id', userID);
  console.table(users);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});