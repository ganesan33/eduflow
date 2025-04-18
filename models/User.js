const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    password: { 
        type: String, 
        required: true,
        minlength: 8
    },
    role: { 
        type: String, 
        enum: ['student', 'instructor' , 'admin'], 
        default: 'student'
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    videoProgress: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        watchedVideos: [{
            videoId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            watchedAt: {
                type: Date,
                default: Date.now
            }
        }],
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model('User', userSchema); 