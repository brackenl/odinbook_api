var express = require("express");
var router = express.Router();

const { check, body, validationResult } = require("express-validator");
const passport = require("passport");

var getTokenData = require("../../utils/getTokenData");
var upload = require("../../utils/multUpload");

var friendsRouter = require("./friends");

const { issueJWT, generatePassword } = require("../../utils/utils");

var User = require("../../models/user");

router.use("/friends", friendsRouter);

router.use(passport.authenticate("jwt", { session: false }));
router.use(getTokenData);

// GET all users
router.get(
  "/",

  async (req, res, next) => {
    try {
      const users = await User.find({});
      res.status(200).json({ users: users });
    } catch (err) {
      console.log(err);
    }
  }
);

// POST search for user

router.post(
  "/search",

  body("firstTerm").trim().escape(),
  body("secondTerm").trim().escape(),

  async (req, res, next) => {
    console.log(req.body);
    const { firstTerm, secondTerm } = req.body;

    const bestMatchUser = await User.findOne({
      $and: [{ first_name: firstTerm }, { last_name: secondTerm }],
    });

    if (bestMatchUser) {
      return res
        .status(201)
        .json({ message: "User found", user: bestMatchUser });
    }

    const foundUser = await User.findOne({
      $or: [
        { first_name: firstTerm },
        { first_name: secondTerm },
        { last_name: firstTerm },
        { last_name: secondTerm },
      ],
    });

    if (foundUser) {
      return res.status(201).json({ message: "User found", user: foundUser });
    } else {
      console.log("not found");
      return res
        .status(200)
        .json({ message: "User not found", error: "User not found" });
    }
  }
);

// GET specific user
router.get(
  "/:userId",

  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.userId)
        .populate("friends")
        .populate("friendRequests")
        .populate("posts");
      res.status(200).json({ user: user });
    } catch (err) {
      console.log(err);
    }
  }
);

// PUT update user details
router.put(
  "/:userId",

  [
    check("password").exists(),
    check("confirmPassword", "Password and confirmed password must match")
      .exists()
      .custom((value, { req }) => value === req.body.password),
  ],

  body("firstName", "First name required").trim().isLength({ min: 1 }).escape(),
  body("lastName", "Last name required").trim().isLength({ min: 1 }).escape(),
  body("email").isEmail().escape(),

  async (req, res, next) => {
    const { firstName, lastName, email, password, profilePicUrl } = req.body;
    const hashedPassword = generatePassword(password);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.payload.id);

      user.first_name = firstName;
      user.last_name = lastName;
      user.email = email;
      user.password = hashedPassword;

      const updatedUser = await user.save();
      const tokenObj = issueJWT(updatedUser);

      return res.status(201).json({
        message: "Profile update successful",
        token: tokenObj,
        user: updatedUser,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

// POST update user profile picture
router.post(
  "/:userId/profileimage",

  body("imageFile")
    .custom((value, { req }) => {
      if (!req.file) {
        return "No image";
      } else if (
        req.file.mimetype === "image/bmp" ||
        req.file.mimetype === "image/gif" ||
        req.file.mimetype === "image/jpeg" ||
        req.file.mimetype === "image/png" ||
        req.file.mimetype === "image/tiff" ||
        req.file.mimetype === "image/webp"
      ) {
        return "image"; // return "non-falsy" value to indicate valid data"
      } else {
        return false; // return "falsy" value to indicate invalid data
      }
    })
    .withMessage("You may only submit image files."),

  upload.single("img-file"),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.json({ message: "No file attached" });
    }

    try {
      const user = await User.findById(req.payload.id);

      user.profilePicUrl = req.file
        ? "http://localhost:3000/public/images/" + req.file.filename
        : null;

      const updatedUser = await user.save();

      return res.status(201).json({
        message: "Profile picture update successful",
        user: updatedUser,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

// DELETE user account

router.delete(`/:userId`, async (req, res, next) => {
  console.log(req.params.userId);
  if (req.params.userId !== req.payload.id) {
    return res
      .status(401)
      .json({ message: "You may only delete your own account" });
  }

  const deletedUser = await User.findByIdAndDelete(req.params.userId);
  const otherUsers = await User.find({ _id: { $ne: req.params.userId } });

  if (!deletedUser) {
    console.log("not found", deletedUser);
    return res.status(404).json({ message: "User not found" });
  }

  for (user of otherUsers) {
    const updatedFriends = user.friends.filter(
      (id) => id !== req.params.userId
    );
    user.friends = updatedFriends;
    await user.save();
  }

  return res.status(200).json({ message: "User deleted" });
});

module.exports = router;
