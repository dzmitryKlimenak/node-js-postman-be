const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 7580;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data.json exists or create it
function ensureDataFileExists() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
}

// Route to save form data to the file
app.post('/api/save', (req, res) => {
    ensureDataFileExists();
    const newItem = req.body;

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading file' });
        }

        let items = data ? JSON.parse(data) : [];

        // Check for duplicate URLs
        if (items.some(item => item.url === newItem.url)) {
            return res.status(400).json({ message: 'A request with this URL already exists' });
        }

        // Save the new item
        items.push(newItem);
        fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving data' });
            }
            res.status(200).json({ message: 'Data saved successfully' });
        });
    });
});

// Route to load saved APIs
app.get('/api/load', (req, res) => {
    ensureDataFileExists();

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error loading data' });
        }

        const items = data ? JSON.parse(data) : [];
        res.status(200).json(items);
    });
});

// Route to delete an API by URL
app.delete('/api/delete', (req, res) => {
    ensureDataFileExists();

    const urlToDelete = req.query.url;

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading file' });
        }

        let items = JSON.parse(data);
        const updatedItems = items.filter(item => item.url !== urlToDelete);

        if (items.length === updatedItems.length) {
            return res.status(404).json({ message: 'API request not found' });
        }

        fs.writeFile(DATA_FILE, JSON.stringify(updatedItems, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error deleting data' });
            }
            res.status(200).json({ message: 'API request deleted successfully' });
        });
    });
});

// Serve the Angular frontend
app.use(express.static(path.join(__dirname, 'dist/frontend')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/frontend/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});