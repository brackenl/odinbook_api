var express = require("express");
var router = express.Router({ mergeParams: true });

const { body, validationResult } = require("express-validator");
const passport = require("passport");

var getTokenData = require("../utils/getTokenData");

var Post = require("../models/post");
var Comment = require("../models/comment");

// POST new comment

router.post(
  "/",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  body("comment", "Comment required").trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const { comment } = req.body;
    console.log(req.params);
    console.log(req.payload);
    console.log(comment);

    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    try {
      const newComment = new Comment({
        user: req.payload.id,
        comment: comment,
        timestamp: new Date(),
        post: req.params.postId,
        likes: [],
      });

      console.log(newComment);
      const savedComment = await newComment.save();

      const relPost = await Post.findById(req.params.postId);
      relPost.comments.push(savedComment);
      await relPost.save();
      return res
        .status(201)
        .json({ message: "Comment saved", comment: savedComment });
    } catch (e) {
      console.log(e);
    }
  }
);

// PUT update comment

router.put(
  "/:commentId",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  body("comment", "Comment required").trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const { comment } = req.body;

    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    try {
      const relComment = await Comment.findById(req.params.commentId);

      if (!relComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (relComment.user != req.payload.id) {
        return res
          .status(401)
          .json({ message: "You may only edit your own comments" });
      }

      relComment.comment = comment;
      const updatedComment = await relComment.save();

      return res.status(201).json({
        message: "Succesfully updated comment",
        comment: updatedComment,
      });
    } catch (e) {
      console.log(e);
    }
  }
);

// PUT toggle like post

router.put(
  "/:commentId/like",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  async (req, res, next) => {
    try {
      const relComment = await Comment.findById(req.params.commentId);

      if (!relComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (relComment.likes.includes(req.payload.id)) {
        const likesArray = [...relComment.likes];
        const filteredLikesArray = likesArray.filter(
          (userId) => userId != req.payload.id
        );
        relComment.likes = filteredLikesArray;
        const updatedComment = await relComment.save();

        return res
          .status(201)
          .json({ message: "Comment unliked", comment: updatedComment });
      }

      relComment.likes.push(req.payload.id);
      const updatedComment = await relComment.save();

      return res
        .status(201)
        .json({ message: "Comment liked", comment: updatedComment });
    } catch (e) {
      console.log(e);
    }
  }
);

// DELETE comment

router.delete(
  "/:commentId",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  async (req, res, next) => {
    try {
      const relComment = await Comment.findById(req.params.commentId);

      if (!relComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (relComment.user != req.payload.id) {
        return res
          .status(401)
          .json({ message: "You may only delete your own comments" });
      }

      const deletedComment = await Comment.findByIdAndDelete(
        req.params.commentId
      );
      if (deletedComment) {
        return res.status(200).json({
          message: "Successfully deleted comment",
          comment: deletedComment,
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
);

module.exports = router;
