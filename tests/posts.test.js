require("dotenv").config();
var app = require("./app");
var request = require("supertest");
var mongoose = require("mongoose");

require("../utils/mongoConfigTesting");

const seedDB = require("./seedTestDB");

let token;
let user;
let postId;

beforeAll(async (done) => {
  // Clears the database and adds some testing data.
  // Jest will wait for this promise to resolve before running tests.
  const obj = await seedDB();
  done();
});

describe("POST /signup", () => {
  it("should return a token and user details", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({
        firstName: "Joe",
        lastName: "Bloggs",
        email: "joebloggs@example.com",
        password: "password",
      })
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(201);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toEqual("Sign up successful");
  });
});

describe("POST /login", () => {
  it("should return a token and user details", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "joebloggs@example.com",
        password: "password",
      })
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toEqual("Log in successful");

    userId = res.body.user.id;
    token = res.body.token.token;
    console.log(token);
  });
});

describe("GET /posts", () => {
  it("should return an array of posts", async () => {
    const res = await request(app).get("/posts");
    // console.log(res);
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
      .send({
        author: userId,
        content: "Here is the post!",
      })
      .set("Accept", "application/json");
    // console.log(res);
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
    // console.log(res);
    expect(res.statusCode).toEqual(201);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("post");
    expect(res.body.post.content).toEqual("Here is a post!");
  });
});

afterAll((done) => {
  // Closing the DB connection allows Jest to exit successfully.
  mongoose.connection.close();
  done();
});
