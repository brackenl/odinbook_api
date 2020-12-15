require("dotenv").config();
var app = require("./app");
var request = require("supertest");
var mongoose = require("mongoose");

require("../utils/mongoConfigTesting");

const seedDB = require("./seedTestDB");

let token;
let postId;
let commentId;

var Post = require("../models/post");
var User = require("../models/user");

beforeAll(async (done) => {
  // Clears the database and adds some testing data.

  const obj = await seedDB();

  const res = await request(app)
    .post("/auth/signup")
    .send({
      firstName: "Joe",
      lastName: "Bloggs",
      email: "joebloggs@example.com",
      password: "password",
    })
    .set("Accept", "application/json");
  token = res.body.token.token;

  const loggedUser = await User.findById(res.body.user.id);
  const otherUsers = await User.find({ _id: { $ne: res.body.user.id } });

  for (user of otherUsers) {
    loggedUser.friends.push(user._id);
  }
  await loggedUser.save();
  done();
});

describe("GET /posts", () => {
  it("should return an array of posts", async () => {
    const res = await request(app).get("/posts").set("Authorization", token);
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("posts");
    expect(res.body.posts.length).toEqual(9);

    postId = res.body.posts[0]._id;
  });
});

describe("GET /posts/:postId", () => {
  it("should return the relevant post", async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("post");
    expect(res.body.post._id).toEqual(postId);
  });
});

describe("POST /posts/", () => {
  it("should return the new post", async () => {
    const res = await request(app)
      .post(`/posts/`)
      .send({
        content: "Here is a post!",
      })
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(201);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("post");
    expect(res.body.post.content).toEqual("Here is a post!");

    postId = res.body.post._id;
  });
});

/* 
describe("PUT /posts/:postId", () => {
  it("should return the updated post", async () => {
    const res = await request(app)
      .put(`/posts/${postId}`)
      .send({
        content: "Here is the updated post",
      })
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(201);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("post");
    expect(res.body.post.content).toEqual("Here is the updated post");
  });
});
*/

describe("POST /posts/:postId/comments", () => {
  it("should return the new comment", async () => {
    const res = await request(app)
      .post(`/posts/${postId}/comments`)
      .send({
        comment: "Here is the comment!",
      })
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(201);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("comment");
    expect(res.body.comment.comment).toEqual("Here is the comment!");

    commentId = res.body.comment._id;
  });
});

describe(`PUT /posts/:postId/comments/:commentId`, () => {
  it("should return the updated comment", async () => {
    const res = await request(app)
      .put(`/posts/${postId}/comments/${commentId}`)
      .send({
        comment: "Here is the updated comment!",
      })
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(201);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("comment");
    expect(res.body.comment.comment).toEqual("Here is the updated comment!");
  });
});

describe("DELETE /posts/:postId/comments/:commentId", () => {
  it("should return the deleted comment", async () => {
    const res = await request(app)
      .delete(`/posts/${postId}/comments/${commentId}`)
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("comment");
    expect(res.body.message).toEqual("Successfully deleted comment");
  });

  it("GET relevant post should not include deleted comment", async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set("Authorization", token)
      .set("Accept", "application/json");

    const postCommentIds = res.body.post.comments.map((comment) => comment._id);
    expect(postCommentIds).not.toContain(commentId);
  });
});

describe("DELETE /posts/:postId", () => {
  it("should return the deleted post", async () => {
    const res = await request(app)
      .delete(`/posts/${postId}`)
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("post");
    expect(res.body.message).toEqual("Successfully deleted");
  });

  it("GET deleted post should return 404", async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(404);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
  });
});

afterAll(async (done) => {
  // Closing the DB connection allows Jest to exit successfully.
  await mongoose.connection.close();
  done();
});
