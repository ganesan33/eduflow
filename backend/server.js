const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const { startTokenCleanup } = require('./middleware/tokenCleanup');
const { setupBlobStorageForStreaming } = require('./utils/setupBlobStorage');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const adminRoutes = require('./routes/admin');
const instructorRequestRoutes = require('./routes/instructorRequests');
const videoRoutes = require('./routes/video');

const app = express();

// Trust proxy - use 1 for single proxy (like nginx, cloudflare)
// In development, this allows localhost to work properly
app.set('trust proxy', 1);

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables.');
}

if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
}

if (process.env.JWT_ACCESS_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
  console.warn('WARNING: JWT secrets should be at least 32 characters long for security.');
}

connectDB();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://eduflow-frontend.azurewebsites.net',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(fileUpload({
  limits: { fileSize: 500 * 1024 * 1024 },
  abortOnLimit: true,
  useTempFiles: false,
  tempFileDir: '/tmp/'
}));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EduFlow backend is running' });
});

// Test email endpoint (remove in production or add auth)
app.post('/api/test-email', async (req, res) => {
  try {
    const { sendEmail } = require('./utils/mailer');
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address required' });
    }

    await sendEmail({
      to: email,
      subject: 'EduFlow Test Email',
      text: 'This is a test email from EduFlow. If you received this, SMTP is working correctly!',
      html: '<p>This is a test email from EduFlow.</p><p>If you received this, SMTP is working correctly!</p>'
    });

    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructor-requests', instructorRequestRoutes);
app.use('/api/video', videoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Backend running on port ${PORT}`);
  startTokenCleanup(60);
  
  // Setup Azure Blob Storage for video streaming
  await setupBlobStorageForStreaming();
});
