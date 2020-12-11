var express = require("express");
var router = express.Router();

// remove
const passport = require("passport");
const jwtStrategy = require("../strategies/jwt");
const facebookTokenStrategy = require("../strategies/facebookToken");

passport.use(jwtStrategy);
passport.use(facebookTokenStrategy);
// const facebookStrategy = require("../strategies/facebookAuth");
// passport.use(facebookStrategy);

var authRouter = require("./auth/auth");
var postsRouter = require("./posts/posts");
var usersRouter = require("./users/users");

router.use("/auth", authRouter);
router.use("/posts", postsRouter);
router.use("/users", usersRouter);

module.exports = router;
