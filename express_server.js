//-------------Setup code--------------------------------------------
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const PORT = 8080;

//-------------Middlewears--------------------------------------------
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieParser());

//-------------View engine setup---------------------------------------
app.set('view engine', 'ejs');

//-------------Static Database-----------------------------------------
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
    hashedPassword: "123"
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user3RandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.ca",
    userID: "user3RandomID"
  },
  "9sm6xK": {
    longURL: "http://www.instagram.com",
    userID: "userRandomID"
  },
};

//-------------Utility functions----------------------------------------
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

const urlsForUser = function(userId) {
  let result = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === userId) {
      result[url] = urlDatabase[url].longURL;
    }
  }
  return result;
};

//-------------Login route-------------------------------------------------
app.route('/login')
  .get((req, res) => {
    const templateVars = {user: users[req.cookies['user_id']]};
    res.render('login', templateVars);
  })
  .post((req, res) => {

    const email = req.body.email;
    const pwd = req.body.password;
    const user = userSearch(email);

    if (!user) {
      return res.status(403).send('User not found. Please check email or register.');
    } else if (!(bcrypt.compare(pwd, user.hashedPassword))) {
      return res.status(403).send('Incorrect password. Please try again with correct password.');
    } else if (bcrypt.compare(pwd, user.hashedPassword)) {
      res.cookie('user_id', user.id);
      res.redirect('/urls');
    }

  });

//-------------Logout route------------------------------------------------
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/home');
});

app.get('/', (req, res) => {
  res.redirect('/home');
});

//--------------/urls route(Homepage)---------------------------------------
app.route('/urls')
  .get((req, res) => {
    console.table(users);
    const userID = req.cookies['user_id'];
    const templateVars = {urls: urlsForUser(userID), user: users[userID]};
    res.render('urls_index', templateVars);
  })
  .post((req, res) => {
    const randomShortUrl = generateRandomString();
    urlDatabase[randomShortUrl] = {longURL: req.body.longURL, userID: req.cookies['user_id']};
    res.redirect(`/urls/${randomShortUrl}`);
  });

//-------------/new route(Create new shortURL)--------------------------------
app.get('/urls/new', (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const userID = req.cookies['user_id'];
  if (userID === undefined) {
    return res.status(404).send('Please login to see this Tiny Url in action.');
  }
  if (userID !== urlDatabase[req.params.shortURL].userID) {
    return res.status(404).send('You are not the owner of this tiny url, So you can not access this url.');
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies['user_id']]
  };
  res.render('urls_show', templateVars);
});

//-------------/u/:shortURL route(Redirection on short url access)---------------
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL === undefined) {
    return res.status(404).send('Long url does not exists for the giiven short url');
  }
  res.redirect(longURL);
});

app.get('/home', (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render('home', templateVars);
});

//-------------/urls/:id route(Show url with edit option)-------------------------
app.post('/urls/:id', (req, res) => {
  const userID = req.cookies['user_id'];
  if (userID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    return res.status(404).send("You are not the owner of this resource you can't modify it.");
  }
});

//-------------/urls/:shortURL/delete route(Delete url from database)--------------
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.cookies['user_id'];
  if (userID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    return res.status(404).send("You are not the owner of this resource you can't modify it.");
  }

});

//-------------/register route(Create new user)------------------------------------
app.route('/register')
  .get((req, res) => {
    const templateVars = {users, user: users[req.cookies['user_id']]};
    res.render('user_registration', templateVars);
  })
  .post((req, res) => {
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
    users[userID] = {id: userID, email: userEmail, hashedPassword: bcrypt.hashSync(userPassword, 10)};
    res.cookie('user_id', userID);
    console.table(users);
    res.redirect('/urls');
  });

//-------------Mapping port to the express app--------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});