const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { ensureRole } = require('../middleware/auth');
const {
  getOrCreateContainerClient,
  getStorageConfig,
  signBlobReadUrl
} = require('../utils/storage');

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

router.post('/', ensureRole('instructor'), async (req, res) => {
  try {
    const { isConfigured } = getStorageConfig();
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Course uploads are unavailable until Azure storage is configured'
      });
    }

    const containerClient = await getOrCreateContainerClient();

    if (!req.files || !req.files.thumbnail) {
      return res.status(400).json({ success: false, message: 'No thumbnail image uploaded' });
    }

    const { title } = req.body;
    const thumbnail = req.files.thumbnail;

    const thumbnailBlobName = `thumbnail-${Date.now()}-${thumbnail.name.replace(/\s+/g, '-')}`;
    const thumbnailBlobClient = containerClient.getBlockBlobClient(thumbnailBlobName);

    await thumbnailBlobClient.uploadData(thumbnail.data, {
      blobHTTPHeaders: { blobContentType: thumbnail.mimetype }
    });

    const videos = [];
    for (const [key, value] of Object.entries(req.files)) {
      if (key.startsWith('videos[')) {
        const match = key.match(/videos\[(\d+)\]\[file\]/);
        if (match) {
          const index = match[1];
          const videoTitle = req.body[`videos[${index}][title]`];
          const videoFile = value;

          const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
          if (!allowedTypes.includes(videoFile.mimetype)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid file type. Only MP4, WebM or Ogg videos are allowed'
            });
          }

          const videoBlobName = `video-${Date.now()}-${videoFile.name.replace(/\s+/g, '-')}`;
          const videoBlobClient = containerClient.getBlockBlobClient(videoBlobName);

          await videoBlobClient.uploadData(videoFile.data, {
            blobHTTPHeaders: { blobContentType: videoFile.mimetype }
          });

          videos.push({
            title: videoTitle,
            videoUrl: videoBlobClient.url,
            order: videos.length
          });
        }
      }
    }

    if (videos.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one video is required' });
    }

    const newCourse = new Course({
      title,
      thumbnailUrl: thumbnailBlobClient.url,
      videos,
      instructor: req.user.id
    });

    await newCourse.save();

    return res.json({ success: true, course: withSignedMedia(newCourse) });
  } catch (error) {
    console.error('Course creation error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create course' });
  }
});

router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'email');
    return res.json({ success: true, courses: courses.map(withSignedMedia) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/my-courses', ensureRole('instructor'), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate('studentsEnrolled', 'email')
      .lean();

    return res.json({ success: true, courses: courses.map(withSignedMedia) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/enroll/:courseId', ensureRole('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    const user = await User.findById(req.user.id);

    if (!course || !user) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (user.enrolledCourses.some((id) => id.toString() === course._id.toString())) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }

    user.enrolledCourses.push(course._id);
    course.studentsEnrolled.push(user._id);

    await user.save();
    await course.save();

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/enrolled', ensureRole('student'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'enrolledCourses',
      populate: { path: 'instructor', select: 'email' }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const coursesWithProgress = user.enrolledCourses.map((course) => {
      const progress = user.videoProgress.find(
        (item) => item.courseId.toString() === course._id.toString()
      );

      const signedCourse = withSignedMedia(course);

      return {
        ...signedCourse,
        watchedVideos: progress?.watchedVideos || [],
        isCompleted: progress?.completed || false
      };
    });

    return res.json({ success: true, courses: coursesWithProgress });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'email')
      .populate('studentsEnrolled', 'email');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.json({ success: true, course: withSignedMedia(course) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:courseId/videos/:videoId/watch', ensureRole('student'), async (req, res) => {
  try {
    const { courseId, videoId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let videoProgress = user.videoProgress.find((progress) => progress.courseId.toString() === courseId);

    if (!videoProgress) {
      user.videoProgress.push({ courseId, watchedVideos: [] });
      videoProgress = user.videoProgress[user.videoProgress.length - 1];
    }

    const alreadyWatched = videoProgress.watchedVideos.some(
      (video) => video.videoId.toString() === videoId
    );

    if (!alreadyWatched) {
      videoProgress.watchedVideos.push({ videoId });

      const course = await Course.findById(courseId);
      if (course && videoProgress.watchedVideos.length >= course.videos.length) {
        videoProgress.completed = true;
        videoProgress.completedAt = new Date();
      }

      await user.save();
    }

    return res.json({
      success: true,
      watchedVideos: videoProgress.watchedVideos,
      completed: videoProgress.completed
    });
  } catch (error) {
    console.error('Video progress error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update video progress' });
  }
});

module.exports = router;
