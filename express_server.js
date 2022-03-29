//-------------Setup code--------------------------------------------
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const { generateRandomString, getUserByEmail, urlsForUser, createErrorObject, users, urlDatabase } = require('./helpers');
const PORT = process.env.PORT || 8080;

//-------------Middlewears--------------------------------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['oneDirection', 'maroon5'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//-------------View engine setup---------------------------------------
app.set('view engine', 'ejs');
app.set('views', './views');
//-------------Static Database-----------------------------------------

//-------------Login route-------------------------------------------------
app.route('/login')
  .get((req, res) => {

    if (!users[req.session.user_id]) {
      const templateVars = { user: users[req.session.user_id] };
      return res.render('login', templateVars);
    } else {
      return res.redirect('/urls');
    }

  })
  .post((req, res) => {

    const { email, password } = req.body;
    const user = getUserByEmail(email, users);

    //Validating login and displaying error according to the different conditions
    if (!user) {
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
      return res.redirect('/urls');
    }

  });

//-------------Logout route------------------------------------------------
app.post('/logout', (req, res) => {

  //Destroying session and redirecting to homepage on logout
  req.session = null;
  return res.redirect('/home');

});

app.get('/', (req, res) => {

  //Is user logged in?
  //Yes-->Redirect to '/urls'
  //No--->Redirect to '/home'
  if (!req.session.user_id) {
    return res.redirect('/home');
  } else {
    return res.redirect('/urls');
  }

});

//--------------/urls route(Homepage for logged in user/Creating new tiny url from create new page)---
app.route('/urls')
  .get((req, res) => {

    const currentUserID = req.session.user_id;
    const templateVars = { urls: urlsForUser(currentUserID, urlDatabase), user: users[currentUserID] };
    res.render('urls_index', templateVars);

  })
  .post((req, res) => {

    //Creating new urlDatabase entry for newly generated short url
    const randomShortUrl = generateRandomString();
    urlDatabase[randomShortUrl] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
      totalVisits: 0,
      visits: {},
      uniqueVisitors: []
    };

    return res.redirect(`/urls/${randomShortUrl}`);

  });

//-------------/new route(Create new shortURL)--------------------------------
app.get('/urls/new', (req, res) => {

  //Is user logged in?
  //No--->Redirect to login page
  //Yes-->Render the create new url page
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render('urls_new', templateVars);

});

app.get('/urls/:shortURL', (req, res) => {

  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;

  //Checking for the ownership of the requested shortURL
  // and displaying error message according to different conditions
  if (!userID) {
    res.status(404);
    const templateVars = createErrorObject(users[userID], 404,
      `'Please login to see this'${shortURL}'  Tiny URL in action.`);
    return res.render('error', templateVars);
  } else if (!urlDatabase[shortURL]) {
    res.status(404);
    const templateVars = createErrorObject(users[userID], 404,
      'This data do not exists. Please check your Tiny URL.');
    return res.render('error', templateVars);
  } else if (userID !== urlDatabase[shortURL].userID) {
    res.status(404);
    const templateVars = createErrorObject(users[userID], 404,
      'You can not access this url because you are not the authorized user of this Tiny URL.');
    return res.render('error', templateVars);
  }

  //Passing the object to ejs template
  const templateVars = {
    shortURL,
    shortURLObj: urlDatabase[shortURL],
    user: users[req.session.user_id],
  };
  res.render('urls_show', templateVars);

});

//-------------/u/:shortURL route(Redirection on short url access)---------------
app.get('/u/:shortURL', (req, res) => {

  const shortUrlObject = urlDatabase[req.params.shortURL];
  const currentUserID = req.session.user_id;

  //Throwing an error if the url is not found in database
  if (!shortUrlObject) {
    res.status(404);
    const templateVars = createErrorObject(users[req.session.user_id], 404,
      `No Long url exists for '${req.params.shortURL}'. Please check the Tiny URL and try again.`);
    return res.render('error', templateVars);
  }

  //----------Url statistics part--------------------

  //Increasing total visits on each visit to the /u/shortURL
  shortUrlObject.totalVisits++;

  //Storing visitor id and current timestamp for the list of each visitor
  const visitorID = generateRandomString();
  shortUrlObject.visits[visitorID] = (new Date(Date.now())).toUTCString();

  //Checking if this is unique user or not
  //Yes--->Push the current user's ID to unique visitor property in urlDatabase
  if (!(shortUrlObject.uniqueVisitors.includes(currentUserID))) {
    shortUrlObject.uniqueVisitors.push(currentUserID);
  }

  const longURL = shortUrlObject.longURL;
  res.redirect(longURL);

});

app.get('/home', (req, res) => {

  //Is user logged in?
  //Yes--->Redirect to '/urls' page
  //No---->Render the home page
  if (users[req.session.user_id]) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render('home', templateVars);

});

//-------------/urls/:id route(Edit long url with for given short url)-------------------------
app.put('/urls/:id', (req, res) => {

  const userID = req.session.user_id;

  //Checking if the cuurent user is owner of this tiny url
  //Yes---->Update the long url
  //No----->Redirect to error message
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

  //Allowing current user to delete short url if the current user is owner of the requested short url
  if (userID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect('/urls');
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

    //Redirecting to registration form if user is not logged in
    if (!users[req.session.user_id]) {
      const templateVars = { users, user: users[req.session.user_id] };
      res.render('user_registration', templateVars);
    } else {
      res.redirect('/urls');
      return;
    }

  })
  .post((req, res) => {

    const { email: userEmail, password: userPassword } = req.body;

    //Checking for errors on the login form
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

    //Creating user
    const userID = generateRandomString();
    users[userID] = { id: userID, email: userEmail, hashedPassword: bcrypt.hashSync(userPassword, 10) };
    req.session.user_id = userID;
    console.table(users);
    return res.redirect('/urls');

  });

//-------------Capturing any unexpected routes--------------
app.get('*', (req, res) => {
  const templateVars = createErrorObject(undefined, 404,
    'Something went wrong. Please try to Login/Register again.');
  return res.render('error', templateVars);
});

//-------------Mapping port to the express app--------------
app.listen(process.env.PORT || PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});