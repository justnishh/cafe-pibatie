const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data:', err);
        return null;
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error writing data:', err);
        return false;
    }
}

app.get('/api/content', (req, res) => {
    const data = readData();
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = readData();
    
    if (data && data.admin) {
        if (username === data.admin.username && password === data.admin.password) {
            res.json({ success: true, token: 'admin-session-token' });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } else {
        res.status(500).json({ error: 'Admin not configured' });
    }
});

app.post('/api/admin/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const data = readData();
    
    if (data && data.admin) {
        if (currentPassword === data.admin.password) {
            data.admin.password = newPassword;
            if (writeData(data)) {
                res.json({ success: true });
            } else {
                res.status(500).json({ error: 'Failed to save' });
            }
        } else {
            res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }
    } else {
        res.status(500).json({ error: 'Admin not configured' });
    }
});

app.put('/api/content/:section', (req, res) => {
    const { section } = req.params;
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

app.post('/api/content/:section/:category', (req, res) => {
    const { section, category } = req.params;
    const item = req.body;
    const data = readData();
    
    if (data) {
        if (!data[section]) data[section] = {};
        if (!data[section][category]) data[section][category] = [];
        
        if (req.body.id) {
            const index = data[section][category].findIndex(i => i.id === req.body.id);
            if (index !== -1) {
                data[section][category][index] = { ...item, id: req.body.id };
            }
        } else {
            item.id = Date.now().toString();
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

app.delete('/api/content/:section/:category/:id', (req, res) => {
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

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
});
