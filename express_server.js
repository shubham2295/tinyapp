const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const morgan = require('morgan');
const PORT = 8080; //default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.set('view engine', 'ejs');

const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.route('/urls')
  .get((req, res) => {
    const templateVars = {urls: urlDatabase};
    res.render("urls_index", templateVars);
  })
  .post((req, res) => {
    const randomShortUrl = generateRandomString();
    urlDatabase[randomShortUrl] = req.body.longURL;
    res.redirect(`/urls/${randomShortUrl}`);
  });

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});