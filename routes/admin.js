const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { BlobServiceClient } = require('@azure/storage-blob');

const blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobService.getContainerClient(process.env.AZURE_STORAGE_CONTAINER);

// Admin middleware
const isAdmin = (req, res, next) => {
    if (req.session.user?.role === 'admin') return next();
    res.status(403).json({ success: false, message: 'Unauthorized' });
};

// Get all courses
router.get('/courses', isAdmin, async (req, res) => {
    try {
        const courses = await Course.find().populate('instructor', 'email');
        res.json({ success: true, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load courses' });
    }
});

// Delete course
// Delete course
router.delete('/courses/:id', isAdmin, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        // Delete thumbnail from Azure
        if (course.thumbnailUrl) {
            const thumbnailBlobName = course.thumbnailUrl.split('/').pop();
            try {
                await containerClient.getBlockBlobClient(thumbnailBlobName).delete();
            } catch (blobErr) {
                console.error('Thumbnail blob deletion error:', blobErr);
            }
        }

        // Delete all videos from Azure
        for (const video of course.videos) {
            if (video.videoUrl) {
                const videoBlobName = video.videoUrl.split('/').pop();
                try {
                    await containerClient.getBlockBlobClient(videoBlobName).delete();
                } catch (blobErr) {
                    console.error('Video blob deletion error:', blobErr);
                }
            }
        }

        // Delete from database
        await Course.deleteOne({ _id: req.params.id });

        res.json({ success: true });
    } catch (err) {
        console.error('Course deletion error:', err);
        res.status(500).json({ success: false, message: 'Deletion failed' });
    }
});

module.exports = router;