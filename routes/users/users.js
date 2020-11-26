var express = require("express");
var router = express.Router();

const { body, validationResult } = require("express-validator");
const passport = require("passport");

var getTokenData = require("../../utils/getTokenData");

var friendsRouter = require("./friends");

var User = require("../../models/user");

router.use("/friends", friendsRouter);

// GET all users
router.get(
  "/",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  async (req, res, next) => {
    try {
      const users = await User.find({});
      res.status(200).json({ users: users });
    } catch (err) {
      console.log(err);
    }
  }
);

// GET specific user
router.get(
  "/:userId",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.userId)
        .populate("friends")
        .populate("posts");
      res.status(200).json({ user: user });
    } catch (err) {
      console.log(err);
    }
  }
);

module.exports = router;
