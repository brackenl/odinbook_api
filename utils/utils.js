const jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

const issueJWT = (user) => {
  const _id = user._id;
  const expiresIn = "1d";

  const payload = {
    id: _id,
    iat: Date.now(),
  };

  const signedToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn,
  };
};

const generatePassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const validatePassword = (password, user) => {
  return bcrypt.compare(password, user.password);
};

module.exports.issueJWT = issueJWT;
module.exports.generatePassword = generatePassword;
module.exports.validatePassword = validatePassword;
