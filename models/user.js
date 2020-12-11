var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");
var findOrCreate = require("mongoose-findorcreate");

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  profilePicUrl: { type: String },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
  friendRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
  // comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  facebookId: { type: String, required: false },
});

// Apply the uniqueValidator plugin to UserSchema.
UserSchema.plugin(uniqueValidator);

// Apply findOrCreate plugin to UserSchema.
UserSchema.plugin(findOrCreate);

//Export model
module.exports = mongoose.model("User", UserSchema);
