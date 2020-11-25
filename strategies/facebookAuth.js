var passport = require("passport"),
  FacebookStrategy = require("passport-facebook").Strategy;

var User = require("../models/user");

module.exports = new FacebookStrategy(
  {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://localhost:8443/auth/facebook/callback",
    profileFields: ["id", "name", "picture", "email"],
  },
  function (accessToken, refreshToken, profile, done) {
    // console.log(profile);

    const relUser = {
      first_name: profile._json.first_name,
      last_name: profile._json.last_name,
      email: profile._json.email,
      // profilePicUrl: profile._json.picture.data.url,
    };
    User.findOrCreate(relUser, function (err, user, created) {
      // console.log("user: ", user);
      // console.log("created: ", created);
      if (err) {
        return done(err);
      }
      if (created) {
        User.findById(user._id, function (err, user) {
          user.profilePicUrl = profile._json.picture.data.url;
          user.save();
        });
      }
      done(null, user);
    });
  }
);
