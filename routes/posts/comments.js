var express = require("express");
var router = express.Router({ mergeParams: true });

const { body, validationResult } = require("express-validator");
const passport = require("passport");

var getTokenData = require("../../utils/getTokenData");

var Post = require("../../models/post");
var Comment = require("../../models/comment");

router.use(
  passport.authenticate(["jwt", "facebook-token"], { session: false })
);
router.use(getTokenData);

// POST new comment

router.post(
  "/",

  body("comment", "Comment required").trim().isLength({ min: 1 }),

  async (req, res, next) => {
    const { comment } = req.body;

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

      const savedComment = await newComment.save();

      const relPost = await Post.findById(req.params.postId);
      relPost.comments.push(savedComment);
      await relPost.save();

      const populatedComment = await Comment.findById(
        savedComment._id
      ).populate("user");
      return res
        .status(201)
        .json({ message: "Comment saved", comment: populatedComment });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT update comment

router.put(
  "/:commentId",

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
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT toggle like post

router.put(
  "/:commentId/like",

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
      return res.status(500).json({ error: e.message });
    }
  }
);

// DELETE comment

router.delete(
  "/:commentId",

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
      return res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
