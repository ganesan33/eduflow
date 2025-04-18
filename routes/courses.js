const express = require('express');
const router = express.Router();
const { BlobServiceClient } = require('@azure/storage-blob');
const Course = require('../models/Course');
const User = require('../models/User');

const blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobService.getContainerClient(process.env.AZURE_STORAGE_CONTAINER);

// Create new course with multiple videos
// Create new course with multiple videos
router.post('/', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'instructor') {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized: Only instructors can create courses' 
            });
        }

        if (!req.files?.thumbnail) {
            return res.status(400).json({ 
                success: false, 
                message: 'No thumbnail image uploaded' 
            });
        }

        const { title } = req.body;

        // Upload thumbnail
        const thumbnail = req.files.thumbnail;
        const thumbnailBlobName = `thumbnail-${Date.now()}-${thumbnail.name.replace(/\s+/g, '-')}`;
        const thumbnailBlobClient = containerClient.getBlockBlobClient(thumbnailBlobName);
        await thumbnailBlobClient.uploadData(thumbnail.data, {
            blobHTTPHeaders: { blobContentType: thumbnail.mimetype }
        });

        // Process videos
        const videos = [];
        for (const [key, value] of Object.entries(req.files)) {
            if (key.startsWith('videos[')) {
                const match = key.match(/videos\[(\d+)\]\[file\]/);
                if (match) {
                    const index = match[1];
                    const videoTitle = req.body[`videos[${index}][title]`];
                    const videoFile = value;

                    // Validate file type
                    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
                    if (!allowedTypes.includes(videoFile.mimetype)) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Invalid file type. Only MP4, WebM or Ogg videos are allowed' 
                        });
                    }

                    // Upload to Azure
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
            return res.status(400).json({ 
                success: false, 
                message: 'At least one video is required' 
            });
        }

        // Create new course
        const newCourse = new Course({
            title,
            thumbnailUrl: thumbnailBlobClient.url,
            videos,
            instructor: req.session.user.id
        });

        await newCourse.save();

        res.json({ 
            success: true,
            course: newCourse
        });

    } catch (err) {
        console.error('Course creation error:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Failed to create course' 
        });
    }
});
// Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().populate('instructor', 'email');
        res.json({ success: true, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get instructor's courses
router.get('/my-courses', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'instructor') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const courses = await Course.find({ instructor: req.session.user.id })
            .populate('studentsEnrolled', 'email')
            .lean(); // Add .lean() for better performance
            
        res.json({ success: true, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Enroll in course
router.post('/enroll/:courseId', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const course = await Course.findById(req.params.courseId);
        const user = await User.findById(req.session.user.id);

        if (!course || !user) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (user.enrolledCourses.includes(course._id)) {
            return res.status(400).json({ success: false, message: 'Already enrolled' });
        }

        user.enrolledCourses.push(course._id);
        await user.save();

        course.studentsEnrolled.push(user._id);
        await course.save();

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get enrolled courses
// Get enrolled courses
// Get enrolled courses
// Get enrolled courses
router.get('/enrolled', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const user = await User.findById(req.session.user.id)
            .populate({
                path: 'enrolledCourses',
                populate: { path: 'instructor', select: 'email' }
            });

        // Add watched video info to each course
        const coursesWithProgress = user.enrolledCourses.map(course => {
            const progress = user.videoProgress.find(
                p => p.courseId.toString() === course._id.toString()
            );
            
            return {
                ...course.toObject(),
                watchedVideos: progress?.watchedVideos || [],
                isCompleted: progress?.completed || false
            };
        });

        res.json({ 
            success: true, 
            courses: coursesWithProgress 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add this new route for getting course details
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'email')
            .populate('studentsEnrolled', 'email');
            
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.json({ success: true, course });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// Track video progress
// Track video progress
router.post('/:courseId/videos/:videoId/watch', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'student') {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const { courseId, videoId } = req.params;
        const userId = req.session.user.id;

        // Find the user and their progress for this course
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Find or create video progress entry for this course
        let videoProgress = user.videoProgress.find(
            progress => progress.courseId.toString() === courseId
        );

        if (!videoProgress) {
            videoProgress = {
                courseId,
                watchedVideos: []
            };
            user.videoProgress.push(videoProgress);
        }

        // Check if video is already marked as watched
        const alreadyWatched = videoProgress.watchedVideos.some(
            v => v.videoId.toString() === videoId
        );

        if (!alreadyWatched) {
            // Add to watched videos
            videoProgress.watchedVideos.push({ videoId });

            // Check if all videos are now watched
            const course = await Course.findById(courseId);
            if (course && videoProgress.watchedVideos.length >= course.videos.length) {
                videoProgress.completed = true;
                videoProgress.completedAt = new Date();
            }

            await user.save();
        }

        res.json({ 
            success: true,
            watchedVideos: videoProgress.watchedVideos,
            completed: videoProgress.completed
        });

    } catch (err) {
        console.error('Video progress error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update video progress' 
        });
    }
});

module.exports = router;