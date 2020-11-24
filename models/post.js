var mongoose = require("mongoose");
var { format } = require("date-fns");

var Schema = mongoose.Schema;

var PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true, maxlength: 50 },
  content: { type: String, required: true },
  timestamp: { type: Date, required: false },
  published: { type: Boolean, required: true },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});

PostSchema.virtual("formatted_time").get(function () {
  return format(new Date(this.timestamp), "dd MMMM yyyy ' at ' HH:mm");
});

//Export model
module.exports = mongoose.model("Post", PostSchema);
