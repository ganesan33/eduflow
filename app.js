require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fileUpload = require('express-fileupload');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(fileUpload());

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Routes
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);

// View Routes
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/views/login.html'));
// Add admin routes
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Update dashboard route
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    let dashboardPage;
    switch(req.session.user.role) {
        case 'admin':
            dashboardPage = 'admin-dashboard.html';
            break;
        case 'instructor':
            dashboardPage = 'instructor-dashboard.html';
            break;
        default:
            dashboardPage = 'student-dashboard.html';
    }
    res.sendFile(__dirname + '/views/' + dashboardPage);
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.use(fileUpload({
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    abortOnLimit: true,
    useTempFiles: false,
    tempFileDir: '/tmp/'
}));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));