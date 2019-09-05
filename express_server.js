const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const { getUserByEmail } = require("./helpers");
const methodOverride = require('method-override');
let count = {};
let visitors = [];
let everyVisit = [];

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "user_id",
    keys: ["id"]
  })
);
app.use(methodOverride('_method'));

//Functions ------------------------------------------------------
//generate a random shortURL
function generateRandomString() {
  let string = "";
  const alphanumeric =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; ++i) {
    string +=
      alphanumeric[Math.floor(Math.random() * (alphanumeric.length - 1))];
  }
  return string;
}

//check if an email address exists ----?
const isEmailExisting = emailAddress => {
  return getUserByEmail(emailAddress, users) ? true : false;
};

//check if the email & password match with the existing ones
const checkEmailPassword = (email, password) => {
  for (let id in users) {
    if (
      email === users[id].email &&
      bcrypt.compareSync(password, users[id].password)
    ) {
      return id;
    }
  }
};

//find the urls created by a specific user
const urlsForUser = user_id => {
  let urlsData = {};
  for (let key in urlDatabase) {
    if (user_id === urlDatabase[key].userID) {
      urlsData[key] = urlDatabase[key].longURL;
    }
  }
  return urlsData;
};

//Variables ---------------------------------------------------
const users = {};
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

//Express Methods -----------------------------------------------

//URLs - delete
app.delete("/urls/:shortURL", (req, res) => {
  if (req.session["user_id"] !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("Please login with the correct user account");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

//URLs - edit
app.put("/urls/:shortURL", (req, res) => {
  if (req.session["user_id"] !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("Please login with the correct user account");
  } else {
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

//U - shortcut to longURL link
app.get("/u/:shortURL", (req, res) => {
  if (req.params.shortURL === "undefined") {
    return res.redirect("/urls");
  }

  if (urlDatabase[req.params.shortURL]) {
    if (!visitors.includes(req.session["user_id"])) {
      visitors.push(req.session['user_id']); 
    }
    count[req.params.shortURL] ++;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const year = now.getFullYear();

    if (minutes < 10) {
      everyVisit.push([req.session["user_id"], `${hours - 4}:0${minutes} on ${month}/${date}/${year}`]);
    } else {
      everyVisit.push([req.session["user_id"], `${hours - 4}:${minutes} on ${month}/${date}/${year}`]);
    }
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    return res
    .status(404)
    .send("Website is not found. Please double check the shortURL. Thank you.");
    // res.redirect('/urls');
  }
  // const longURL = urlDatabase[req.params.shortURL].longURL;
  
});

//Login
app.post("/login", (req, res) => {
  const ID = checkEmailPassword(req.body.email, req.body.password);
  if (ID) {
    req.session.user_id = ID;
    return res.redirect("/urls");
  }

  return res
    .status(403)
    .send("Email cannot be found or password is not correct.");
});

app.get("/login", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    errorMessage: true,
    user_id: users[req.session["user_id"]]
  };
  res.render("login", templateVars);
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//Register a new user account
app.post("/register", (req, res) => {
  if (
    req.body.email === "" ||
    req.body.password === "" ||
    isEmailExisting(req.body.email)
  ) {
    res
      .status(400)
      .send(
        "Either the email address you entered exists or invalid email address/password"
      );
  } else {
    const userID = generateRandomString();
    const bcryptPassword = bcrypt.hashSync(req.body.password, 10);
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcryptPassword
    };
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.get("/register", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    errorMessage: true,
    user_id: users[req.session["user_id"]]
  };
  res.render("register", templateVars);
});

//URLS - Adding New URLs
app.post("/urls", (req, res) => {
  let urlExist = false;
  for (let key in urlDatabase) {
    if (req.body.longURL === urlDatabase[key].longURL) {
      urlExist = true;
      break;
    }
  }

  if (urlExist) {
    let templateVars = {
      urls: urlDatabase,
      errorMessage: true,
      user_id: users[req.session["user_id"]]
    };
    res.render("urls_index", templateVars);
  } else {
    if (req.body.longURL.slice(0, 7) !== "http://") {
      req.body.longURL = "http://" + req.body.longURL;
    }
    const generatedShortURL = generateRandomString();
    urlDatabase[generatedShortURL] = {
      longURL: req.body.longURL,
      userID: users[req.session["user_id"]].id
    };
    count[generatedShortURL] = 0;
    res.redirect(`/urls/${generatedShortURL}`);
  }
});

app.get("/urls", (req, res) => {
  const urlsData = urlsForUser(req.session["user_id"]);
  let templateVars = {
    urls: urlsData,
    errorMessage: false,
    user_id: users[req.session["user_id"]]
  };
  res.render("urls_index", templateVars);
});

//URLS NEW - Page Set Up
app.get("/urls/new", (req, res) => {
  if (users[req.session["user_id"]]) {
    let templateVars = {
      urls: urlDatabase,
      errorMessage: false,
      user_id: users[req.session["user_id"]]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//URLS/:shortURL - Show the Page with shortURL with Update Function
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  if (
    !urlDatabase[req.params.shortURL] ||
    urlDatabase[req.params.shortURL].userID !== req.session["user_id"]
  ) {
    res.status(403).send("Please login with the correct user account.");
  } else {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user_id: users[req.session["user_id"]],
      count: count,
      visitors: visitors,
      everyVisit: everyVisit,
    };
    console.log(count);
    console.log(visitors);
    console.log(everyVisit);
    res.render("urls_show", templateVars);
  }
});

//Home Page - redirect to /urls
app.get("/", (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
  } else {
    res.redirect('/login');
  }
});

//Show Server PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});