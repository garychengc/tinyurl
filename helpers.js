const bcrypt = require("bcrypt");

//Functions ------------------------------------------------------
//generate a random shortURL
const generateRandomString = () => {
  let string = "";
  const alphanumeric =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; ++i) {
    string +=
      alphanumeric[Math.floor(Math.random() * (alphanumeric.length - 1))];
  }
  return string;
};

//helper function - look up user by their email
const getUserByEmail = (email, users) => {
  for (let id in users) {
    if (email === users[id].email) {
      return users[id];
    }
  }
};

//check if the email address exists in the userDatabase
const isEmailExisting = (emailAddress, users) => {
  return getUserByEmail(emailAddress, users) ? true : false;
};

//check if the email & password match with the existing ones
const checkEmailPassword = (email, password, users) => {
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
const urlsForUser = (userId, urlDatabase) => {
  let urlsData = {};
  for (let key in urlDatabase) {
    if (userId === urlDatabase[key].userID) {
      urlsData[key] = urlDatabase[key].longURL;
    }
  }
  return urlsData;
};

module.exports = {
  generateRandomString,
  isEmailExisting,
  checkEmailPassword,
  urlsForUser
};
