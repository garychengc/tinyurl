const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


//generate random shortURl code
function generateRandomString() {
  let string = "";
  const alphanumeric =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; ++i) {
    string +=
      alphanumeric[Math.floor(Math.random() * (alphanumeric.length - 1))];
  }
  return string;
};

//checking if an email address exists
const isEmailExisting = (emailAddress) => {
  for (let id in users) {
    if (emailAddress === users[id].email) {
      return true;
    }
  }
}


const urlDatabase = {
  b2xVn2: "https://www.lighthouselabs.ca",
  "9sm5xK": "https://www.google.com"
};


const users = {};

app.post("/urls", (req, res) => {
  let urlExist = false;
  for (let key in urlDatabase) {
    if (req.body.longURL === urlDatabase[key]) {
      // console.log(templateVars);
      urlExist = true;
      break;
    }
  } 

  if (urlExist) {
    let templateVars = { urls: urlDatabase, errorMessage: true, username: req.cookies['username']};
    res.render("urls_index", templateVars);

  } else {
    
    if (req.body.longURL.slice(0, 8) !== 'https://') {
      req.body.longURL = 'https://' + req.body.longURL 
    }

    const generatedShortURL = generateRandomString();
    urlDatabase[generatedShortURL] = req.body.longURL;
    res.redirect(`/urls/${generatedShortURL}`);
    // console.log(req.body);  // Log the POST request body to the console
    // res.send("Ok");         // Respond with 'Ok' (we will replace this)
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});


app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:shortURL/edit', (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  if (req.params.shortURL === "undefined") {
    return res.redirect("/urls");
  }

  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let templateVars = { urls: urlDatabase, errorMessage: true, username: req.cookies['username']};
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '' || isEmailExisting(req.body.email)) {
    res.status(400).send ( '400 status code' );
  }
  
  const userID = generateRandomString();
  users[userID] = {id: userID, email: req.body.email, password: req.body.password};
  res.cookie('username', userID);
  res.redirect('/urls');
});


app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, errorMessage: false, username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, errorMessage: false, username: req.cookies['username'] }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies['username']
  };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
