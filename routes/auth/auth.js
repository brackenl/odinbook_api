var express = require("express");
var router = express.Router();

const facebookTokenStrategy = require("../../strategies/facebookToken");

const { check, body, validationResult } = require("express-validator");

var User = require("../../models/user");

var setupTestDrive = require("./setupTestDrive");

//probs remove
const passport = require("passport");
passport.use(facebookTokenStrategy);

const {
  issueJWT,
  generatePassword,
  validatePassword,
} = require("../../utils/utils");

router.post(
  "/facebook/token",
  passport.authenticate("facebook-token"),
  (req, res) => {
    res.status(201).json({
      message: "FB Auth successful",
      user: {
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        email: req.user.email,
        id: req.user._id,
        profilePicUrl: req.user.profilePicUrl ? req.user.profilePicUrl : "",
        facebookId: req.user.facebookId,
      },
    });
  }
);

// POST sign up
router.post(
  "/signup",

  body("firstName", "First name required").trim().isLength({ min: 1 }).escape(),
  body("lastName", "Last name required").trim().isLength({ min: 1 }).escape(),
  body("email", "Email required").trim().isEmail().escape(),
  body("password", "Password required").trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { firstName, lastName, email, password, profilePicUrl } = req.body;
    const hashedPassword = generatePassword(password);

    const user = new User({
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: hashedPassword,
      posts: [],
      profilePicUrl: profilePicUrl ? profilePicUrl : "",
      friends: [],
      friendRequests: [],
    });

    try {
      await user.save();
      const tokenObj = issueJWT(user);

      return res.status(201).json({
        message: "Sign up successful",
        token: tokenObj,
        user: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          id: user._id,
          profilePicUrl: user.profilePicUrl ? user.profilePicUrl : "",
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// POST login

router.post(
  "/login",

  body("email", "Email required").trim().isEmail().escape(),
  body("password", "Password required").trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const { email, password } = req.body;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    try {
      const relUser = await User.findOne({ email }).select("+password");
      if (relUser) {
        const passwordMatch = validatePassword(password, relUser);
        if (passwordMatch) {
          const tokenObj = issueJWT(relUser);

          return res.status(200).json({
            message: "Log in successful",
            token: tokenObj,
            user: {
              first_name: relUser.first_name,
              last_name: relUser.last_name,
              email: relUser.email,
              id: relUser._id,
              profilePicUrl: relUser.profilePicUrl ? relUser.profilePicUrl : "",
            },
          });
        } else {
          res.status(401).json({ message: "Incorrect password" });
        }
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// POST test drive

router.post("/testdrive", async (req, res, next) => {
  const user = await setupTestDrive();

  const tokenObj = issueJWT(user);

  return res.status(201).json({
    user: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      id: user._id,
      profilePicUrl: user.profilePicUrl ? user.profilePicUrl : "",
    },
    message: "Test drive log in successful",
    token: tokenObj,
  });
});

module.exports = router;
