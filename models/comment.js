var mongoose = require("mongoose");
var { format } = require("date-fns");

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  comment: { type: String, required: true, maxlength: 300 },
  timestamp: { type: Date, required: true },
  post: { type: Schema.Types.ObjectId, ref: "Post" },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  // edited: { type: Boolean, required: false },
  // editedTimestamp: { type: Date, required: false },
});

CommentSchema.virtual("formatted_time").get(function () {
  return format(new Date(this.timestamp), "dd MMMM yyyy ' at ' HH:mm");
});

//Export model
module.exports = mongoose.model("Comment", CommentSchema);
