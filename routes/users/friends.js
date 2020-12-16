var express = require("express");
var router = express.Router();

const { body, validationResult } = require("express-validator");
const passport = require("passport");

var getTokenData = require("../../utils/getTokenData");

var User = require("../../models/user");

router.use(
  passport.authenticate(["jwt", "facebook-token"], { session: false })
);
router.use(getTokenData);

// POST make friend request

router.post(
  "/req",

  async (req, res, next) => {
    const { relUserId } = req.body;

    try {
      const relUser = await User.findById(relUserId);

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
      return res.status(500).json({ error: error.message });
    }
  }
);

// DELETE cancel (withdraw) friend request

router.delete(
  "/cancel",

  async (req, res, next) => {
    const { relUserId } = req.body;

    try {
      const relUser = await User.findById(relUserId);

      // check requesting user is not the same as the relevant user
      if (!relUser.friendRequests.includes(req.payload.id)) {
        return res.status(404).json({ message: "Friend request not found." });
      }

      // delete the request
      const updatedRequests = relUser.friendRequests.filter(
        (user) => user != req.payload.id
      );
      relUser.friendRequests = updatedRequests;
      const updatedUser = await relUser.save();

      return res
        .status(200)
        .json({ message: "Friend request deleted", user: updatedUser });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// PUT accept friend request
router.put(
  "/accept",

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

      const populatedUser = await User.findById(updatedUser._id).populate(
        "friends"
      );

      return res
        .status(201)
        .json({ message: "Friend request accepted", user: populatedUser });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// DELETE decline (reject) friend request

router.delete(
  "/decline",

  async (req, res, next) => {
    const { relUserId } = req.body;

    try {
      const relUser = await User.findById(req.payload.id);

      const updatedFriendReqs = relUser.friendRequests.filter(
        (item) => item._id != relUserId
      );
      relUser.friendRequests = updatedFriendReqs;
      const updatedUser = await relUser.save();

      return res
        .status(201)
        .json({ message: "Friend request declined", user: updatedUser });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// DELETE remove friend
router.delete(
  "/remove",

  async (req, res, next) => {
    const { relUserId } = req.body;

    try {
      const relUser = await User.findById(relUserId);

      // delete from user's friends list
      const updatedFriends = relUser.friends.filter(
        (item) => item._id != req.payload.id
      );
      relUser.friends = updatedFriends;
      await relUser.save();

      // delete from logged in user's friends list
      const loggedInUser = await User.findById(req.payload.id);
      const loggedInUserUpdatedFriends = loggedInUser.friends.filter(
        (item) => item._id != req.payload.id
      );
      loggedInUser.friends = loggedInUserUpdatedFriends;
      await loggedInUser.save();

      return res.status(201).json({
        message: "Friend removed",
        user: relUser,
        // loggedInUser: loggedInUser,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
