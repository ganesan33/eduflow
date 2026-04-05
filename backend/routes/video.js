const express = require('express');
const { ensureAuth } = require('../middleware/auth');
const Course = require('../models/Course');

const router = express.Router();

// Proxy video streaming with range support
router.get('/stream/:courseId/:videoId', ensureAuth, async (req, res) => {
  try {
    const { courseId, videoId } = req.params;
    
    // Verify user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if user is enrolled or is the instructor
    const isInstructor = String(course.instructor) === String(req.user.id);
    const isEnrolled = course.studentsEnrolled.some(
      studentId => String(studentId) === String(req.user.id)
    );

    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Find the video
    const video = course.videos.find(v => String(v._id) === videoId);
    if (!video || !video.videoUrl) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Redirect to the signed URL - let Azure handle the streaming
    return res.redirect(video.videoUrl);
  } catch (error) {
    console.error('Video stream error:', error);
    return res.status(500).json({ success: false, message: 'Failed to stream video' });
  }
});

module.exports = router;
