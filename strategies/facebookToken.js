const passport = require("passport");
const FacebookTokenStrategy = require("passport-facebook-token");

var User = require("../models/user");

// change to module export

module.exports = new FacebookTokenStrategy(
  {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    fbGraphVersion: "v3.0",
  },
  function (accessToken, refreshToken, profile, done) {
    User.findOrCreate(
      { facebookId: profile.id },
      {
        first_name: profile._json.first_name,
        last_name: profile._json.last_name,
        email: profile._json.email,
        profilePicUrl: profile.photos[0].value,
      },
      function (error, user) {
        return done(error, user);
      }
    );
  }
);

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
