var express = require("express");
var router = express.Router();

const passport = require("passport");
const facebookStrategy = require("../../strategies/facebookAuth");
passport.use(facebookStrategy);

var User = require("../../models/user");

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// FACEBOOK AUTHENTICATION

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
router.get("/", passport.authenticate("facebook", { scope: "email" }));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
router.get(
  "/callback",
  passport.authenticate("facebook", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

module.exports = router;
