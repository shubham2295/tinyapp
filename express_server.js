//-------------Setup code--------------------------------------------
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const {generateRandomString, getUserByEmail, urlsForUser, createErrorObject} = require('./helpers');
const PORT = 8080;

//-------------Middlewears--------------------------------------------
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['oneDirection', 'maroon5'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(function(req, res, next) {
  res.locals.user = "Shubham";
  res.locals.authenticated = true;
  next();
});

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
    hashedPassword: "$2a$10$leC5Ic51JIohQIVXpW9XbuZiNrffCBiBz7N7dw2EBgWYggwWJdgaC"
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user3RandomID",
    totalVisits: 0,
    uniqueVisits: 0
  },
  "9sm5xK": {
    longURL: "http://www.google.ca",
    userID: "user3RandomID",
    totalVisits: 0,
    uniqueVisits: 0
  },
  "111111": {
    longURL: "http://www.instagram.com",
    userID: "userRandomID",
    totalVisits: 0,
    uniqueVisits: 0
  },
};

const visitors = {
  "b2xVna2": {
    uniqueVisitors: ["userRandomID", "user3RandomID"],
    visits: {"xyzahg": 'Thu, 24 Mar 2022 20:06:22 GMT'}
  },
  'b2xVn2': {},
  '9sm5xK': {}
};

//-------------Login route-------------------------------------------------
app.route('/login')
  .get((req, res) => {
    const templateVars = {user: users[req.session.user_id]};
    res.render('login', templateVars);
  })
  .post((req, res) => {
    const {email, password} = req.body;
    const user = getUserByEmail(email, users);

    if (user === undefined) {
      res.status(403);
      const templateVars = createErrorObject(undefined, 404,
        'User not found. Please check your email address or register.');
      return res.render('error', templateVars);
    } else if (!(bcrypt.compareSync(password, user.hashedPassword))) {
      res.status(403);
      const templateVars = createErrorObject(undefined, 404,
        'Incorrect password. Please try again with correct password.');
      return res.render('error', templateVars);
    } else if (bcrypt.compareSync(password, user.hashedPassword)) {
      req.session.user_id = user.id;
      res.redirect('/urls');
      return;
    }

  });

//-------------Logout route------------------------------------------------
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/home');
  return;
});

app.get('/', (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect('/home');
    return;
  } else {
    res.redirect('/urls');
    return;
  }
});

//--------------/urls route(Homepage)---------------------------------------
app.route('/urls')
  .get((req, res) => {
    const userID = req.session.user_id;
    const templateVars = {urls: urlsForUser(userID, urlDatabase), user: users[userID]};
    res.render('urls_index', templateVars);
  })
  .post((req, res) => {
    const randomShortUrl = generateRandomString();
    urlDatabase[randomShortUrl] = {longURL: req.body.longURL, userID: req.session.user_id, totalVisits: 0, uniqueVisits: 0};
    visitors[randomShortUrl] = {};
    res.redirect(`/urls/${randomShortUrl}`);
    return;
  });

//-------------/new route(Create new shortURL)--------------------------------
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }
  const templateVars = {user: users[req.session.user_id]};
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(404);
    const templateVars = createErrorObject(users[userID], 404,
      `'Please login to see '${req.params.shortURL}' this Tiny URL in action.`);
    return res.render('error', templateVars);
  } else if (!urlDatabase[req.params.shortURL]) {
    res.status(404);
    const templateVars = createErrorObject(users[userID], 404,
      'This data do not exists. Please check your Tiny URL.');
    return res.render('error', templateVars);
  } else if (userID !== urlDatabase[req.params.shortURL].userID) {
    res.status(404);
    const templateVars = createErrorObject(users[userID], 404,
      'You can not access this url because you are not the authorized user of this Tiny URL.');
    return res.render('error', templateVars);
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id],
    totalVisits: urlDatabase[req.params.shortURL].totalVisits,
    uniqueVisits: urlDatabase[req.params.shortURL].uniqueVisits,
    visits: visitors[req.params.shortURL] === undefined ? undefined : visitors[req.params.shortURL].visits
  };
  res.render('urls_show', templateVars);
});

//-------------/u/:shortURL route(Redirection on short url access)---------------
app.get('/u/:shortURL', (req, res) => {
  const urlObject = urlDatabase[req.params.shortURL];
  if (!urlObject) {
    res.status(404);
    const templateVars = createErrorObject(users[req.session.user_id], 404,
      `No Long url exists for '${req.params.shortURL}'. Please check the Tiny URL and try again.`);
    return res.render('error', templateVars);
  }
  urlObject.totalVisits++;
  const visitorID = generateRandomString();
  if (visitors[req.params.shortURL].visits === undefined) {
    visitors[req.params.shortURL].visits = {};
    visitors[req.params.shortURL].visits[visitorID] = (new Date(Date.now())).toUTCString();
  } else {
    visitors[req.params.shortURL].visits[visitorID] = (new Date(Date.now())).toUTCString();
  }

  if (visitors[req.params.shortURL].uniqueVisitors === undefined) {
    visitors[req.params.shortURL].uniqueVisitors = [req.session.user_id];

    urlObject.uniqueVisits++;
  } else if (!(visitors[req.params.shortURL].uniqueVisitors.includes(req.session.user_id))) {
    urlObject.uniqueVisits++;
    visitors[req.params.shortURL].uniqueVisitors.push(req.session.user_id);
  }
  const longURL = urlObject.longURL;

  res.redirect(longURL);
});

app.get('/home', (req, res) => {
  const templateVars = {user: users[req.session.user_id]};
  res.render('home', templateVars);
});

//-------------/urls/:id route(Edit long url with for given short url)-------------------------
app.put('/urls/:id', (req, res) => {
  const userID = req.session.user_id;
  if (userID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
    return;
  } else {
    res.status(404);
    const templateVars = createErrorObject(users[req.session.user_id], 404,
      'You are not the authorized user of this resource you can not modify it.');
    return res.render('error', templateVars);
  }
});

//-------------/urls/:shortURL/delete route(Delete url from database)--------------
app.delete('/urls/:shortURL/', (req, res) => {
  const userID = req.session.user_id;
  if (userID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
    return;
  } else {
    res.status(404);
    const templateVars = createErrorObject(users[req.session.user_id], 404,
      'You are not the authorized user of this resource you can not delete it.');
    return res.render('error', templateVars);
  }

});

//-------------/register route(Create new user)------------------------------------
app.route('/register')
  .get((req, res) => {
    if (!users[req.session.user_id]) {
      const templateVars = {users, user: users[req.session.user_id]};
      res.render('user_registration', templateVars);
    } else {
      res.redirect('/urls');
      return;
    }
  })
  .post((req, res) => {
    const {email: userEmail, password: userPassword} = req.body;


    if (userEmail === "" || userPassword === "") {
      res.status(400);
      const templateVars = createErrorObject(users[req.session.user_id], 400,
        'Email or Password field can\'t be blank. Please enter valid details.');
      return res.render('error', templateVars);
    }

    if (typeof (getUserByEmail(userEmail, users)) === 'object') {
      res.status(400);
      const templateVars = createErrorObject(users[req.session.user_id], 400,
        'User with this email address already exists please register with different email address.');
      return res.render('error', templateVars);
    }

    const userID = generateRandomString();
    users[userID] = {id: userID, email: userEmail, hashedPassword: bcrypt.hashSync(userPassword, 10)};
    req.session.user_id = userID;
    console.table(users);
    res.redirect('/urls');
    return;
  });

//-------------Mapping port to the express app--------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});