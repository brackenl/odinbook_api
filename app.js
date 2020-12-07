require("dotenv").config();
var cors = require("cors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var passport = require("passport");
var bodyParser = require("body-parser");

require("./utils/mongoConfig");
// require("./utils/mongoConfigTesting");

var indexRouter = require("./routes/index");

var app = express();

app.use(cors());
app.use(logger("dev"));
app.use(bodyParser({ limit: "10mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(passport.initialize());

app.use("/", indexRouter);

module.exports = app;
