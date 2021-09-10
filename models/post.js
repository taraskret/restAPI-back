const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: String,
    imageUrl: String,
    content: String,
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
