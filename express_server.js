const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

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
}

//check if an email address exists
const isEmailExisting = emailAddress => {
  for (let id in users) {
    if (emailAddress === users[id].email) {
      return true;
    }
  }
};

//check if the email & password match with the existing ones.
const checkEmailPassword = (email, password) => {
  for (let id in users) {
    if (email === users[id].email && password === users[id].password) {
      return id;
    }
  }
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {};

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
      user_id: users[req.cookies["user_id"]]
    };
    res.render("urls_index", templateVars);
  } else {
    if (req.body.longURL.slice(0, 7) !== "http://") {
      req.body.longURL = "http://" + req.body.longURL;
    }
    const generatedShortURL = generateRandomString();
    console.log(urlDatabase);
    console.log(generatedShortURL);
    console.log(req.cookies['user_id']);
    console.log(users[req.cookies["user_id"]]);

    urlDatabase[generatedShortURL] = {
      longURL: req.body.longURL,
      userID: users[req.cookies["user_id"]]
    };
    res.redirect(`/urls/${generatedShortURL}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  if (req.params.shortURL === "undefined") {
    return res.redirect("/urls");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  const ID = checkEmailPassword(req.body.email, req.body.password);
  if (ID) {
    res.cookie("user_id", ID);
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
    user_id: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

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
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});

app.get("/register", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    errorMessage: true,
    user_id: users[req.cookies["user_id"]]
  };
  res.render("register", templateVars);
});

app.get("/urls", (req, res) => {
  let urlsData = {};
  for (let key in urlDatabase) {
    if (users[req.cookies["user_id"]] === urlDatabase[key].userID) {
      urlsData[key] = urlDatabase[key];
    }
  }

  let templateVars = {
    urls: urlsData,
    errorMessage: false,
    user_id: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (users[req.cookies["user_id"]]) {
    let templateVars = {
      urls: urlDatabase,
      errorMessage: false,
      user_id: users[req.cookies["user_id"]]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
