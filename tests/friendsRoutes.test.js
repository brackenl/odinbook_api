require("dotenv").config();
var app = require("./app");
var request = require("supertest");
var mongoose = require("mongoose");

require("../utils/mongoConfigTesting");

const seedDB = require("./seedTestDB");

let token;
let userId;
let commentId;

beforeAll(async (done) => {
  // Clears the database and adds some testing data.
  // Jest will wait for this promise to resolve before running tests.
  const obj = await seedDB();

  const res = await request(app)
    .post("/auth/login")
    .send({
      email: "dsmith@example.com",
      password: "password",
    })
    .set("Accept", "application/json");
  token = res.body.token.token;
  userId = res.body.user.id;
  done();
});

describe("GET /users", () => {
  it("should return an array of users", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("users");
    expect(res.body.users).toHaveLength(3);
  });
});

describe("GET /users/:userId", () => {
  it("should return the specified user", async () => {
    const res = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", token)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("friends");
    expect(res.body.user).toHaveProperty("posts");
  });
});

/*
describe("GET /posts/:postId", () => {
  it("should return the relevant post", async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set("Accept", "application/json");
    expect(res.statusCode).toEqual(200);
    expect(res.header["content-type"]).toEqual(expect.stringMatching(/json/));
    expect(res.body).toHaveProperty("post");
    expect(res.body.post._id).toEqual(postId);
  });
});
*/

afterAll(async (done) => {
  // Closing the DB connection allows Jest to exit successfully.
  await mongoose.connection.close();
  done();
});
