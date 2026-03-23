const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { fetchAllStatuses } = require('./services/fetchers');

const app = express();
const port = process.env.PORT || 3001;

// Initialize cache with 2 minutes standard TTL
const cache = new NodeCache({ stdTTL: 120 });

app.use(cors());
app.use(express.json());

// Telegram Bot Stub/Mock
function notifyTelegramBot(serviceName, oldStatus, newStatus) {
    console.log(`[TELEGRAM ALERT 🚨] Service ${serviceName} changed status from ${oldStatus} to ${newStatus}`);
    // Future implementation: Send HTTP request to Telegram Bot API
}

app.get('/api/status', async (req, res) => {
    try {
        // Check cache first
        const cachedStatuses = cache.get('all_statuses');
        if (cachedStatuses) {
            console.log('Serving from cache');
            return res.json(cachedStatuses);
        }

        console.log('Fetching live data...');
        const statuses = await fetchAllStatuses(cache, notifyTelegramBot);
        
        // Save to cache
        cache.set('all_statuses', statuses);
        res.json(statuses);
    } catch (error) {
        console.error('Error fetching statuses:', error);
        res.status(500).json({ error: 'Internal server error while fetching statuses' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
