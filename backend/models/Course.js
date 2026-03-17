const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  videos: [videoSchema],
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', courseSchema);
