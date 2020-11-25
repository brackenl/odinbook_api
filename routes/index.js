var express = require("express");
var router = express.Router();

// remove
const passport = require("passport");
const jwtStrategy = require("../strategies/jwt");
passport.use(jwtStrategy);
const facebookStrategy = require("../strategies/facebookAuth");
passport.use(facebookStrategy);

var authRouter = require("./auth/auth");
var postsRouter = require("./posts");

router.use("/auth", authRouter);
router.use("/posts", postsRouter);

router.get("/", function (req, res, next) {
  console.log(req);
  res.render("index", { title: "Express" });
});

// ROUTE FOR TESTING AUTH STRATEGIES
router.get(
  "/protected",
  passport.authenticate(["jwt", "facebook"], { session: false }),
  (req, res, next) => {
    res.status(200).json({
      success: true,
      msg: "You are successfully authenticated to this route!",
    });
  }
);

module.exports = router;
