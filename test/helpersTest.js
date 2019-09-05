const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "Gary": {
    id: "BEST", 
    email: "testing@gmail.com", 
    password: "123"
  },
  "Chen": {
    id: "ONE", 
    email: "test@hotmail.com", 
    password: "123"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("testing@gmail.com", testUsers)
    const expectedOutput = "BEST";
    assert.strictEqual(user.id, expectedOutput);
  });

  it('should return undefined if an email is not in our database', function() {
    const user = getUserByEmail("123@gmail.com", testUsers)
    const expectedOutput = undefined;
    assert.deepEqual(user, expectedOutput);
  });
});