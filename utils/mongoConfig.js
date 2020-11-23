const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongoDb = `YOUR MONGO URL`;

mongoose.connect(mongoDb, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));
