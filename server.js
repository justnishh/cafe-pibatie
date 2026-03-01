require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param } = require('express-validator');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-insecure-change-me';

// Security Headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled - enables inline scripts for admin panel
    crossOriginEmbedderPolicy: false,
}));

// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// CORS Configuration

// CORS Configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with size limits
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10kb' }));

// Disable x-powered-by header
app.disable('x-powered-by');

// Prevent directory listing - serve static files with index.html fallback
app.use(express.static(__dirname, {
    index: false,
    dotfiles: 'ignore',
    extensions: ['html']
}));

// Rate Limiting - General API
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiting - Login
const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000,
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
    message: { error: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Data operations
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            console.error('Data file not found:', DATA_FILE);
            return null;
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data:', err.message);
        return null;
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error writing data:', err.message);
        return false;
    }
}

// Input sanitization
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>\"'%;()&+]/g, '').substring(0, 1000);
}

// API Routes

// GET content - Public (read-only)
app.get('/api/content', (req, res) => {
    const data = readData();
    if (data) {
        // Remove admin credentials from response
        const safeData = { ...data };
        delete safeData.admin;
        res.json(safeData);
    } else {
        res.status(500).json({ error: 'Unable to load content' });
    }
});

// POST login - Rate limited
app.post('/api/login', loginLimiter, [
    body('username').isString().trim().isLength({ min: 1, max: 50 }),
    body('password').isString().isLength({ min: 1, max: 100 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const { username, password } = req.body;
    const data = readData();
    
    if (data && data.admin) {
        // Compare hashed password or plain text (for backward compatibility)
        let isValid = false;
        if (data.admin.passwordHash) {
            isValid = await bcrypt.compare(password, data.admin.passwordHash);
        } else {
            // Fallback for plain text password (deprecated - should migrate)
            isValid = (username === data.admin.username && password === data.admin.password);
        }
        
        if (isValid) {
            // Log successful login (without sensitive data)
            console.log(`[SECURITY] Successful login for user: ${username} from IP: ${req.ip}`);
            res.json({ success: true, token: generateToken() });
        } else {
            // Log failed login attempt
            console.log(`[SECURITY] Failed login attempt for user: ${username} from IP: ${req.ip}`);
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } else {
        res.status(500).json({ error: 'Server configuration error' });
    }
});

// POST change password
app.post('/api/admin/change-password', loginLimiter, [
    body('currentPassword').isString().isLength({ min: 1, max: 100 }),
    body('newPassword').isString().isLength({ min: 6, max: 50 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const { currentPassword, newPassword } = req.body;
    const data = readData();
    
    if (data && data.admin) {
        // Verify current password
        let isValid = false;
        if (data.admin.passwordHash) {
            isValid = await bcrypt.compare(currentPassword, data.admin.passwordHash);
        } else {
            isValid = (currentPassword === data.admin.password);
        }
        
        if (isValid) {
            // Hash new password
            data.admin.passwordHash = await bcrypt.hash(newPassword, 12);
            // Keep plain text for backward compatibility temporarily
            data.admin.password = newPassword;
            
            if (writeData(data)) {
                console.log(`[SECURITY] Password changed successfully`);
                res.json({ success: true });
            } else {
                res.status(500).json({ error: 'Failed to save' });
            }
        } else {
            res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }
    } else {
        res.status(500).json({ error: 'Server configuration error' });
    }
});

// PUT update section content
app.put('/api/content/:section', [
    param('section').isString().matches(/^[a-z-]+$/),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid section name' });
    }

    const { section } = req.params;
    const allowedSections = ['hero', 'story', 'ambiance', 'locations', 'cta', 'footer', 'site', 'reviews'];
    
    if (!allowedSections.includes(section)) {
        return res.status(400).json({ error: 'Invalid section' });
    }

    const newData = req.body;
    const data = readData();
    
    if (data) {
        data[section] = newData;
        if (writeData(data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } else {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// POST add/update menu item
app.post('/api/content/:section/:category', [
    param('section').isString().matches(/^[a-z-]+$/),
    param('category').isString().matches(/^[a-z-]+$/),
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
    body('price').isString().isLength({ max: 20 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const { section, category } = req.params;
    const allowedSections = ['beverages', 'food'];
    
    if (!allowedSections.includes(section)) {
        return res.status(400).json({ error: 'Invalid section' });
    }

    // Sanitize inputs
    const item = {
        id: req.body.id || Date.now().toString(),
        name: sanitizeString(req.body.name),
        hindi: sanitizeString(req.body.hindi || ''),
        desc: sanitizeString(req.body.desc || ''),
        price: sanitizeString(req.body.price || ''),
        note: Boolean(req.body.note)
    };
    
    const data = readData();
    
    if (data) {
        if (!data[section]) data[section] = {};
        if (!data[section][category]) data[section][category] = [];
        
        if (req.body.id) {
            const index = data[section][category].findIndex(i => i.id === req.body.id);
            if (index !== -1) {
                data[section][category][index] = { ...data[section][category][index], ...item };
            }
        } else {
            data[section][category].push(item);
        }
        
        if (writeData(data)) {
            res.json({ success: true, item });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } else {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// DELETE menu item
app.delete('/api/content/:section/:category/:id', [
    param('section').isString().matches(/^[a-z-]+$/),
    param('category').isString().matches(/^[a-z-]+$/),
    param('id').isString().isLength({ max: 50 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const { section, category, id } = req.params;
    const data = readData();
    
    if (data && data[section] && data[section][category]) {
        data[section][category] = data[section][category].filter(item => item.id !== id);
        
        if (writeData(data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

// Admin routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/:file', (req, res) => {
    const file = req.params.file;
    // Prevent directory traversal
    if (file.includes('..') || file.includes('/') || file.includes('\\')) {
        return res.status(403).json({ error: 'Access denied' });
    }
    res.sendFile(path.join(__dirname, 'admin', file));
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Generate simple session token
function generateToken() {
    return Buffer.from(`${Date.now()}-${Math.random().toString(36)}`).toString('base64');
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
