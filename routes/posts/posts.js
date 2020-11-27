var express = require("express");
var router = express.Router();

const { body, validationResult } = require("express-validator");
const passport = require("passport");

var getTokenData = require("../../utils/getTokenData");
var commentRouter = require("./comments");

var Post = require("../../models/post");

router.use("/:postId/comments", commentRouter);

// GET all posts

router.get("/", async (req, res, next) => {
  try {
    const posts = await Post.find({}).populate("author");
    return res.status(200).json({ posts: posts });
  } catch (err) {
    console.log(err);
  }
});

// GET single post

router.get("/:id", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate("comments").exec();
    if (post) {
      return res.status(200).json({ post: post });
    } else {
      return res.status(404).json({ message: "Post not found" });
    }
  } catch (err) {
    console.log(err);
  }
});

// POST new post // NEED TO UPDATE FOR IMAGE UPLOAD

router.post(
  "/",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  body("content", "Content required").trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const { content } = req.body;

    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    try {
      const newPost = new Post({
        author: req.payload.id,
        content: content,
        timestamp: new Date(),
        comment: [],
        likes: [],
      });
      const savedPost = await newPost.save();
      const relPost = await Post.findById(savedPost._id).populate("author");
      if (relPost) {
        return res
          .status(201)
          .json({ message: "Succesfully posted", post: relPost });
      }
    } catch (e) {
      console.log(e);
    }
  }
);

// PUT update post content

router.put(
  "/:postId",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  body("content", "Content required").trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const { content } = req.body;

    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    try {
      const relPost = await Post.findById(req.params.postId);

      if (!relPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (relPost.author != req.payload.id) {
        return res
          .status(401)
          .json({ message: "You may only edit your own posts" });
      }

      relPost.content = content;
      const updatedPost = await relPost.save();

      return res
        .status(201)
        .json({ message: "Succesfully updated", post: updatedPost });
    } catch (e) {
      console.log(e);
    }
  }
);

// PUT toggle like post

router.put(
  "/:postId/like",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  async (req, res, next) => {
    try {
      const relPost = await Post.findById(req.params.postId);

      if (!relPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (relPost.likes.includes(req.payload.id)) {
        const likesArray = [...relPost.likes];
        const filteredLikesArray = likesArray.filter(
          (userId) => userId != req.payload.id
        );
        relPost.likes = filteredLikesArray;
        const updatedPost = await relPost.save();

        return res
          .status(201)
          .json({ message: "Post unliked", post: updatedPost });
      }

      relPost.likes.push(req.payload.id);
      const updatedPost = await relPost.save();

      return res.status(201).json({ message: "Post liked", post: updatedPost });
    } catch (e) {
      console.log(e);
    }
  }
);

// DELETE Post

router.delete(
  "/:postId",

  passport.authenticate("jwt", { session: false }),
  getTokenData,

  async (req, res, next) => {
    try {
      const relPost = await Post.findById(req.params.postId);

      if (!relPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (relPost.author != req.payload.id) {
        return res
          .status(401)
          .json({ message: "You may only delete your own posts" });
      }

      const deletedPost = await Post.findByIdAndDelete(req.params.postId);
      if (deletedPost) {
        return res
          .status(200)
          .json({ message: "Successfully deleted", post: deletedPost });
      }
    } catch (e) {
      console.log(e);
    }
  }
);

module.exports = router;
