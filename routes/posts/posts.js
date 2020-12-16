var express = require("express");
var router = express.Router();

const { body, validationResult } = require("express-validator");
const passport = require("passport");

var getTokenData = require("../../utils/getTokenData");
var upload = require("../../utils/multUpload");
var commentRouter = require("./comments");

var Post = require("../../models/post");
var User = require("../../models/user");

router.use("/:postId/comments", commentRouter);

router.use(
  passport.authenticate(["jwt", "facebook-token"], {
    session: false,
  })
);
router.use(getTokenData);

// GET all posts (self + friends) (10 at a time)

router.get(
  "/",

  async (req, res, next) => {
    const skip = Number(req.query.skip);

    try {
      const loggedInUser = await User.findById(req.payload.id);
      const posts = await Post.find(
        { author: [req.payload.id, ...loggedInUser.friends] },
        null,
        {
          skip,
          limit: 10,
        }
      )
        .sort({ timestamp: "desc" })
        .populate("author")
        .populate({
          path: "comments",
          model: "Comment",
          populate: {
            path: "user",
            model: "User",
          },
        });

      return res.status(200).json({ posts: posts });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// GET single post (NOT USED)

router.get("/:id", async (req, res, next) => {
  try {
    const requestingUser = await User.findById(req.payload.id);
    const post = await Post.findById(req.params.id).populate("comments").exec();
    if (post) {
      // Check that requesting user is permitted to view the post

      if (
        post.author != req.payload.id &&
        !requestingUser.friends.includes(post.author)
      ) {
        return res.status(401).json({
          message: "You must be friends with the author to view this post",
        });
      }
      // if allowed to view, return post
      return res.status(200).json({ post: post });
    } else {
      return res.status(404).json({ message: "Post not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST new post

router.post(
  "/",

  body("content", "Content required").trim().isLength({ min: 1 }),

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
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT add image to existing post

router.put(
  "/:postId",

  body("img-file")
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
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    try {
      const relPost = await Post.findById(req.params.postId);
      relPost.imgUrl = req.file
        ? `${process.env.BASE_URI}/public/images/` + req.file.filename
        : null;

      const savedPost = await relPost.save();
      const updatedPost = await Post.findById(savedPost._id).populate("author");
      if (updatedPost) {
        return res
          .status(201)
          .json({ message: "Succesfully posted", post: updatedPost });
      }
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT update post content (not used)

/*
router.put(
  "/:postId", // NEED TO EDIT ROUTE TO AVOID CLASHING WITH ABOVE ROUTE

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
      return res.status(500).json({ error: e.message });
    }
  }
);
*/

// PUT toggle like post

router.put(
  "/:postId/like",

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
      return res.status(500).json({ error: e.message });
    }
  }
);

// DELETE Post

router.delete(
  "/:postId",

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
      return res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
