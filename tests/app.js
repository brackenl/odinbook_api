require("dotenv").config();
const express = require("express");
const app = express();

require("../utils/mongoConfigTesting");

const indexRouter = require("../routes/index");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/", indexRouter);

module.exports = app;
