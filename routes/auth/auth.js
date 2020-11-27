var express = require("express");
var router = express.Router();

const { check, body, validationResult } = require("express-validator");
var bcrypt = require("bcryptjs");

const passport = require("passport");
const jwt = require("jsonwebtoken");

var facebookRouter = require("./facebook");

var User = require("../../models/user");

const {
  issueJWT,
  generatePassword,
  validatePassword,
} = require("../../utils/utils");

router.use("/facebook", facebookRouter);

// POST sign up
router.post(
  "/signup",

  [check("email").normalizeEmail().isEmail()],

  body("firstName", "First name required").trim().isLength({ min: 1 }).escape(),
  body("lastName", "Last name required").trim().isLength({ min: 1 }).escape(),
  body("email", "Email required").trim().isLength({ min: 1 }).escape(),
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
          // name: `${user.first_name} ${user.last_name}`,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          id: user._id,
          profilePicUrl: user.profilePicUrl ? user.profilePicUrl : "",
        },
      });
    } catch (err) {
      console.log(err);
    }
  }
);

// POST login

router.post(
  "/login",

  body("email", "Email required").trim().isLength({ min: 1 }).escape(),
  body("password", "Password required").trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const { email, password } = req.body;
    try {
      const relUser = await User.findOne({ email });
      if (relUser) {
        const passwordMatch = validatePassword(password, relUser);
        if (passwordMatch) {
          const tokenObj = issueJWT(relUser);

          return res.status(200).json({
            message: "Log in successful",
            token: tokenObj,
            user: {
              // name: `${relUser.first_name} ${relUser.last_name}`,
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
      console.log(e);
    }
  }
);

module.exports = router;
