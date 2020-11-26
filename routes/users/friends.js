var express = require("express");
var router = express.Router();

const { body, validationResult } = require("express-validator");
const passport = require("passport");

var getTokenData = require("../../utils/getTokenData");

var User = require("../../models/user");

// POST make friend request

router.post(
  "/req",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  async (req, res, next) => {
    const { relUserId } = req.body;

    try {
      const relUser = await User.findById(relUserId);
      console.log(relUser);
      console.log(req.payload);

      // check requesting user is not the same as the relevant user
      if (relUser._id == req.payload.id) {
        return res.status(400).json({ message: "You cannot friend yourself" });
      }

      // check that the requesting user is not already a friend of the relevant user
      if (relUser.friends.includes(req.payload.id)) {
        return res
          .status(400)
          .json({ message: "You are already a friend of this user" });
      }

      // check that the requesting user has not already sent a friend request
      if (relUser.friendRequests.includes(req.payload.id)) {
        return res.status(400).json({
          message: "You have already sent a friend request to this user",
        });
      }

      // push the requesting user's id to the relevant user's friendRequests array
      const updatedFriendReqs = [...relUser.friendRequests, req.payload.id];
      relUser.friendRequests = updatedFriendReqs;
      const updatedUser = await relUser.save();
      return res
        .status(201)
        .json({ message: "Friend request submitted", user: updatedUser });
    } catch (error) {
      console.log(error);
    }
  }
);

// PUT accept friend request
router.put(
  "/accept",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  async (req, res, next) => {
    const { relUserId } = req.body;

    try {
      const relUser = await User.findById(relUserId);
      const acceptingUser = await User.findById(req.payload.id);

      // check that accepting user has a friend request from relevant user
      if (!acceptingUser.friendRequests.includes(relUserId)) {
        return res.status(400).json({
          message: "Friend request not found",
        });
      }

      const updatedFriendReqs = acceptingUser.friendRequests.filter(
        (friendReq) => friendReq != relUserId
      );
      acceptingUser.friendRequests = updatedFriendReqs;
      const updatedFriends = [...acceptingUser.friends, relUserId];
      acceptingUser.friends = updatedFriends;
      const updatedUser = await acceptingUser.save();

      const updatedRelUserFriends = [...relUser.friends, req.payload.id];
      relUser.friends = updatedRelUserFriends;
      await relUser.save();

      return res
        .status(201)
        .json({ message: "Friend request accepted", user: updatedUser });
    } catch (error) {
      console.log(error);
    }
  }
);

module.exports = router;
