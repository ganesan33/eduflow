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
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationTokenHash: {
    type: String,
    default: null
  },
  emailVerificationExpiresAt: {
    type: Date,
    default: null
  },
  passwordResetTokenHash: {
    type: String,
    default: null
  },
  passwordResetExpiresAt: {
    type: Date,
    default: null
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  refreshTokens: [{
    tokenHash: {
      type: String,
      required: true
    },
    tokenFamily: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
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
  playbackPositions: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    positionSeconds: {
      type: Number,
      default: 0
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for Cosmos DB optimization
userSchema.index({ email: 1, emailVerified: 1 });
userSchema.index({ tokenVersion: 1 });
userSchema.index({ 'refreshTokens.expiresAt': 1 });

userSchema.pre('save', async function onSave(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);

    if (!this.isNew) {
      this.tokenVersion += 1;
      this.refreshTokens = [];
    }
  }
  next();
});

userSchema.methods.addRefreshToken = async function(tokenHash, tokenFamily, expiresAt, ipAddress, userAgent) {
  const maxTokens = 5;
  
  this.refreshTokens.push({
    tokenHash,
    tokenFamily,
    expiresAt,
    ipAddress,
    userAgent,
    createdAt: new Date(),
    lastUsedAt: new Date()
  });

  if (this.refreshTokens.length > maxTokens) {
    this.refreshTokens.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
    this.refreshTokens = this.refreshTokens.slice(0, maxTokens);
  }

  await this.save();
};

userSchema.methods.revokeTokenFamily = async function(tokenFamily) {
  this.refreshTokens = this.refreshTokens.filter(t => t.tokenFamily !== tokenFamily);
  await this.save();
};

userSchema.methods.cleanExpiredTokens = async function() {
  const now = new Date();
  const originalLength = this.refreshTokens.length;
  this.refreshTokens = this.refreshTokens.filter(t => t.expiresAt > now);
  
  if (this.refreshTokens.length !== originalLength) {
    await this.save();
  }
};

module.exports = mongoose.model('User', userSchema);
