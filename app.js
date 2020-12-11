require("dotenv").config();
var cors = require("cors");
var express = require("express");
var path = require("path");
// var cookieSession = require("cookie-session");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var passport = require("passport");
// const passportSetup = require("./config/passport-setup");
var bodyParser = require("body-parser");
// var session = require("express-session");

require("./utils/mongoConfig");
// require("./utils/mongoConfigTesting");

var indexRouter = require("./routes/index");
// const authRoutes = require("./routes/auth/auth-routes");

var app = express();
app.use(cookieParser());

app.use(cors());
app.use(logger("dev"));
app.use(bodyParser({ limit: "10mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use("/public", express.static(path.join(__dirname, "public")));

// set up routes
app.use("/api", indexRouter);

module.exports = app;
