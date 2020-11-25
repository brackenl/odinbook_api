const jwt = require("jsonwebtoken");
const ExtractJwt = require("passport-jwt").ExtractJwt;

const getTokenData = (req, res, next) => {
  const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  const payload = jwt.verify(jwtFromRequest(req), process.env.JWT_SECRET);
  req.payload = payload;
  next();
};

module.exports = getTokenData;
