const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve live data files
app.use('/data', express.static(path.join(__dirname, 'public/data')));

// In production (after build), serve static files from dist
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
}

const DATA_DIR = path.join(__dirname, 'public/data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Ensure directories exist
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// API Routes
app.get('/api/backups', (req, res) => {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read backups' });
        const backups = files
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();
        res.json(backups);
    });
});

app.post('/api/save', (req, res) => {
    const newData = req.body;
    const filePath = path.join(DATA_DIR, 'resume.json');

    if (!newData || !newData.en || !newData.fr) {
        return res.status(400).json({ error: 'Invalid data structure' });
    }

    // 1. Create Backup of current version
    if (fs.existsSync(filePath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `resume_${timestamp}.json`);
        fs.copyFileSync(filePath, backupPath);
    }

    // 2. Clear old backups (keep last 10)
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.json'))
        .sort();

    while (files.length > 10) {
        const oldest = files.shift();
        fs.unlinkSync(path.join(BACKUP_DIR, oldest));
    }

    // 3. Save new version
    fs.writeFile(filePath, JSON.stringify(newData, null, 2), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).json({ error: 'Failed to write file' });
        }
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
