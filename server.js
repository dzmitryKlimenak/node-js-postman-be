const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7580; // Use port 7580 or environment-specific port
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

    // Read the existing data from the file
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            return res.status(500).json({ message: 'Error reading file' });
        }

        let items = [];
        if (data) {
            items = JSON.parse(data);
        }

        // Check if a request with the same URL already exists
        const duplicate = items.find(item => item.url === newItem.url);
        if (duplicate) {
            return res.status(400).json({ message: 'A request with this URL already exists' });
        }

        // Add the new item to the list and write it to the file
        items.push(newItem);
        fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), (err) => {
            if (err) {
                console.error('Error writing to file', err);
                return res.status(500).json({ message: 'Error saving data' });
            }
            res.status(200).json({ message: 'Data saved successfully' });
        });
    });
});

// Route to load data from the file on app initialization
app.get('/api/load', (req, res) => {
    ensureDataFileExists();

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            return res.status(500).json({ message: 'Error loading data' });
        }

        const items = data ? JSON.parse(data) : [];
        res.status(200).json(items);
    });
});

// Route to delete an API request by URL
app.delete('/api/delete', (req, res) => {
    ensureDataFileExists();

    const urlToDelete = req.query.url;

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            return res.status(500).json({ message: 'Error reading file' });
        }

        let items = JSON.parse(data);
        const updatedItems = items.filter(item => item.url !== urlToDelete);

        if (items.length === updatedItems.length) {
            return res.status(404).json({ message: 'API request not found' });
        }

        fs.writeFile(DATA_FILE, JSON.stringify(updatedItems, null, 2), (err) => {
            if (err) {
                console.error('Error writing to file', err);
                return res.status(500).json({ message: 'Error deleting data' });
            }
            res.status(200).json({ message: 'API request deleted successfully' });
        });
    });
});

// Start the server on port 7580
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});