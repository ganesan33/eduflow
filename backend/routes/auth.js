const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { ensureAuth } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many failed auth attempts. Try again later.' },
  validate: { trustProxy: false }
});

router.use(['/login', '/signup'], authLimiter);

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many refresh requests. Try again later.' },
  validate: { trustProxy: false }
});

router.use('/refresh', refreshLimiter);

const emailFlowLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again later.' },
  validate: { trustProxy: false }
});

router.use(['/verify-email/request', '/password-reset/request'], emailFlowLimiter);

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOneTimeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getAppBaseUrl() {
  return process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'https://eduflow-frontend.azurewebsites.net';
}

async function trySendEmail(emailPayload) {
  try {
    const result = await sendEmail(emailPayload);
    const acceptedCount = Array.isArray(result.accepted) ? result.accepted.length : 0;
    if (acceptedCount > 0) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Email delivery error:', error.message || error);
    return false;
  }
}

function buildCookieOptions(isRefreshToken = false) {
  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: isRefreshToken ? '/api/auth/refresh' : '/'
  };
  
  return baseOptions;
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

function generateRefreshToken(user, tokenFamily) {
  return jwt.sign({
    sub: String(user._id),
    tv: user.tokenVersion,
    type: 'refresh',
    family: tokenFamily,
    jti: crypto.randomBytes(16).toString('hex')
  }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
}

function getClientInfo(req) {
  // Try multiple sources for IP address
  let ipAddress = 'unknown';
  
  if (req.ip) {
    ipAddress = req.ip;
  } else if (req.headers['x-forwarded-for']) {
    ipAddress = req.headers['x-forwarded-for'].split(',')[0].trim();
  } else if (req.connection && req.connection.remoteAddress) {
    ipAddress = req.connection.remoteAddress;
  } else if (req.socket && req.socket.remoteAddress) {
    ipAddress = req.socket.remoteAddress;
  }
  
  const userAgent = req.get('user-agent') || 'unknown';
  return { ipAddress, userAgent };
}

async function issueAuthCookies(res, userDoc, req, tokenFamily = null) {
  const accessToken = generateAccessToken(userDoc);
  
  const newTokenFamily = tokenFamily || crypto.randomBytes(16).toString('hex');
  const refreshToken = generateRefreshToken(userDoc, newTokenFamily);
  
  const { ipAddress, userAgent } = getClientInfo(req);
  
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const expiresAt = new Date();
  if (refreshExpiresIn.endsWith('d')) {
    expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiresIn));
  } else if (refreshExpiresIn.endsWith('h')) {
    expiresAt.setHours(expiresAt.getHours() + parseInt(refreshExpiresIn));
  }
  
  await userDoc.addRefreshToken(
    hashToken(refreshToken),
    newTokenFamily,
    expiresAt,
    ipAddress,
    userAgent
  );

  res.cookie('access_token', accessToken, {
    ...buildCookieOptions(false),
    maxAge: 15 * 60 * 1000
  });
  
  res.cookie('refresh_token', refreshToken, {
    ...buildCookieOptions(true),
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', buildCookieOptions(false));
  res.clearCookie('refresh_token', buildCookieOptions(true));
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

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before signing in'
      });
    }

    await issueAuthCookies(res, user, req);

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = new User({
      email,
      password,
      role: 'student',
      emailVerified: false
    });

    await user.save();

    const token = generateOneTimeToken();
    user.emailVerificationTokenHash = hashToken(token);
    user.emailVerificationExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const verificationLink = `${getAppBaseUrl()}/login?mode=verify&email=${encodeURIComponent(user.email)}&token=${token}`;
    const emailSent = await trySendEmail({
      to: user.email,
      subject: 'Verify your EduFlow email',
      text: `Welcome to EduFlow. Verify your email by opening this link: ${verificationLink}`,
      html: `<p>Welcome to EduFlow.</p><p>Please verify your email by clicking <a href="${verificationLink}">Verify Email</a>.</p><p>This link expires in 30 minutes.</p>`
    });

    return res.status(201).json({
      success: true,
      message: emailSent
        ? 'Signup successful. Verification email sent. Please check inbox, spam, or promotions.'
        : 'Signup successful. Verification email could not be sent right now. Please use resend verification after SMTP is available.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/verify-email/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user || user.emailVerified) {
      return res.json({ success: true, message: 'If the account exists, a verification email has been sent.' });
    }

    const token = generateOneTimeToken();
    user.emailVerificationTokenHash = hashToken(token);
    user.emailVerificationExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const verificationLink = `${getAppBaseUrl()}/login?mode=verify&email=${encodeURIComponent(user.email)}&token=${token}`;
    await trySendEmail({
      to: user.email,
      subject: 'Verify your EduFlow email',
      text: `Verify your email by opening this link: ${verificationLink}`,
      html: `<p>Please verify your email by clicking <a href="${verificationLink}">Verify Email</a>.</p><p>This link expires in 30 minutes.</p>`
    });

    return res.json({
      success: true,
      message: emailSent
        ? 'If the account exists, a verification email has been sent. Check inbox, spam, or promotions.'
        : 'If the account exists, we could not send email right now. Please try again shortly.'
    });
  } catch (error) {
    console.error('Verify email request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

router.post('/verify-email/confirm', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ success: false, message: 'Email and token are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification request' });
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    const tokenHash = hashToken(token);
    const tokenValid = user.emailVerificationTokenHash
      && user.emailVerificationTokenHash === tokenHash
      && user.emailVerificationExpiresAt
      && user.emailVerificationExpiresAt > new Date();

    if (!tokenValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    await issueAuthCookies(res, user, req);

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Verify email confirm error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify email' });
  }
});

router.post('/password-reset/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: true, message: 'If the account exists, a reset email has been sent.' });
    }

    const token = generateOneTimeToken();
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetLink = `${getAppBaseUrl()}/login?mode=reset&email=${encodeURIComponent(user.email)}&token=${token}`;
    const emailSent = await trySendEmail({
      to: user.email,
      subject: 'Reset your EduFlow password',
      text: `Reset your password by opening this link: ${resetLink}`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetLink}">Reset Password</a> to continue.</p><p>This link expires in 30 minutes.</p>`
    });

    return res.json({
      success: true,
      message: emailSent
        ? 'If the account exists, a reset email has been sent. Check inbox, spam, or promotions.'
        : 'If the account exists, we could not send email right now. Please try again shortly.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

router.post('/password-reset/confirm', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid reset request' });
    }

    const tokenHash = hashToken(token);
    const tokenValid = user.passwordResetTokenHash
      && user.passwordResetTokenHash === tokenHash
      && user.passwordResetExpiresAt
      && user.passwordResetExpiresAt > new Date();

    if (!tokenValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successful. Please sign in.' });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
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

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    if (decoded.type !== 'refresh' || !decoded.family) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.sub).select('email role tokenVersion refreshTokens emailVerified');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    if (user.tokenVersion !== decoded.tv) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked' });
    }

    await user.cleanExpiredTokens();

    const tokenHash = hashToken(refreshToken);
    const storedToken = user.refreshTokens.find(
      t => t.tokenHash === tokenHash && t.tokenFamily === decoded.family
    );

    if (!storedToken) {
      await user.revokeTokenFamily(decoded.family);
      clearAuthCookies(res);
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token reuse detected. All tokens in this family have been revoked.' 
      });
    }

    if (storedToken.expiresAt < new Date()) {
      await user.revokeTokenFamily(decoded.family);
      return res.status(401).json({ success: false, message: 'Refresh token expired' });
    }

    user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== tokenHash);
    await user.save();

    await issueAuthCookies(res, user, req, decoded.family);

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.sub);
      
      if (user && decoded.family) {
        await user.revokeTokenFamily(decoded.family);
      }
    } catch (error) {
      // Ignore invalid refresh token and still clear cookies.
    }
  }

  clearAuthCookies(res);
  return res.json({ success: true, message: 'Logged out successfully' });
});

router.post('/logout-all', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshTokens = [];
      user.tokenVersion += 1;
      await user.save();
    }

    clearAuthCookies(res);
    return res.json({ success: true, message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({ success: false, message: 'Failed to logout from all devices' });
  }
});

module.exports = router;
