const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  body: { type: String, required: true },
  helpful: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isQuestion: { type: Boolean, default: false },
  isAnswered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  replies: [ReplySchema]
});

module.exports = mongoose.model('Post', PostSchema);
