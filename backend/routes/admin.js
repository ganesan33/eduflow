const express = require('express');
const Course = require('../models/Course');
const { ensureRole } = require('../middleware/auth');
const { getContainerClient, signBlobReadUrl } = require('../utils/storage');

const router = express.Router();

function withSignedMedia(course) {
  const plainCourse = typeof course.toObject === 'function' ? course.toObject() : { ...course };

  return {
    ...plainCourse,
    thumbnailUrl: signBlobReadUrl(plainCourse.thumbnailUrl),
    videos: (plainCourse.videos || []).map((video) => ({
      ...video,
      videoUrl: signBlobReadUrl(video.videoUrl)
    }))
  };
}

router.get('/courses', ensureRole('admin'), async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'email');
    return res.json({ success: true, courses: courses.map(withSignedMedia) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load courses' });
  }
});

router.delete('/courses/:id', ensureRole('admin'), async (req, res) => {
  try {
    const containerClient = getContainerClient();
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (containerClient && course.thumbnailUrl) {
      const thumbnailBlobName = course.thumbnailUrl.split('/').pop();
      try {
        await containerClient.getBlockBlobClient(thumbnailBlobName).delete();
      } catch (blobError) {
        console.error('Thumbnail blob deletion error:', blobError);
      }
    }

    for (const video of course.videos) {
      if (!containerClient) {
        continue;
      }

      if (video.videoUrl) {
        const videoBlobName = video.videoUrl.split('/').pop();
        try {
          await containerClient.getBlockBlobClient(videoBlobName).delete();
        } catch (blobError) {
          console.error('Video blob deletion error:', blobError);
        }
      }
    }

    await Course.deleteOne({ _id: req.params.id });

    return res.json({ success: true });
  } catch (error) {
    console.error('Course deletion error:', error);
    return res.status(500).json({ success: false, message: 'Deletion failed' });
  }
});

module.exports = router;
