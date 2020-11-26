require("dotenv").config();
var app = require("./app");
var request = require("supertest");
var mongoose = require("mongoose");

require("../utils/mongoConfigTesting");

const seedDB = require("./seedTestDB");

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
  });
});

afterAll(async (done) => {
  // Closing the DB connection allows Jest to exit successfully.
  await mongoose.connection.close();
  done();
});
