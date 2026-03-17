const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { ensureAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth requests. Try again later.' }
});

router.use(['/login', '/signup', '/refresh'], authLimiter);

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  };
}

function generateAccessToken(user) {
  return jwt.sign({
    sub: String(user._id),
    email: user.email,
    role: user.role,
    tv: user.tokenVersion
  }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
  });
}

function generateRefreshToken(user) {
  return jwt.sign({
    sub: String(user._id),
    tv: user.tokenVersion,
    type: 'refresh'
  }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
}

async function issueAuthCookies(res, userDoc) {
  const accessToken = generateAccessToken(userDoc);
  const refreshToken = generateRefreshToken(userDoc);

  await User.findByIdAndUpdate(userDoc._id, {
    refreshTokenHash: hashToken(refreshToken)
  });

  const cookieOptions = buildCookieOptions();
  res.cookie('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000
  });
  res.cookie('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookies(res) {
  const cookieOptions = buildCookieOptions();
  res.clearCookie('access_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    await issueAuthCookies(res, user);

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = new User({
      email,
      password,
      role: role || 'student'
    });

    await user.save();

    await issueAuthCookies(res, user);

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/me', ensureAuth, (req, res) => {
  return res.json({ success: true, user: req.user });
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Missing refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.sub).select('email role tokenVersion refreshTokenHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    if (user.tokenVersion !== decoded.tv || user.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked' });
    }

    await issueAuthCookies(res, user);

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.sub, { refreshTokenHash: null });
    } catch (error) {
      // Ignore invalid refresh token and still clear cookies.
    }
  }

  clearAuthCookies(res);
  return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
