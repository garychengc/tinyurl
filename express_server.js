const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
// const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const { getUserByEmail } = require("./helpers");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());
app.use(
  cookieSession({
    name: "user_id",
    keys: ["id"]
  })
);

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

  // for (let id in users) {
  //   if (emailAddress === users[id].email) {
  //     return true;
  //   }
  // }
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
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session["user_id"] !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("Please login with the correct user account");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

//URLs - edit
app.post("/urls/:shortURL/edit", (req, res) => {
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
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//Login
app.post("/login", (req, res) => {
  const ID = checkEmailPassword(req.body.email, req.body.password);
  if (ID) {
    req.session.user_id = ID;
    // res.cookie("user_id", ID);
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
      user_id: users[req.session["user_id"]]
    };
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
