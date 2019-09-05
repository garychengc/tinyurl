//helper function - look up user by their email
const getUserByEmail = (email, users) => {
  for (let id in users) {
    if (email === users[id].email) {
      return users[id];
    }
  }
};

module.exports = { getUserByEmail };
