const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { fetchAllStatuses } = require('./services/fetchers');

const app = express();
const port = process.env.PORT || 3001;

// Initialize cache with 2 minutes standard TTL
const cache = new NodeCache({ stdTTL: 120 });

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.CLIENT_URL, // URL do frontend em produção (ex: https://monitor.vercel.app)
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permite requisições sem origin (ex: apps mobile, curl) e origens na lista
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS bloqueado para origem: ${origin}`));
        }
    }
}));
app.use(express.json());

// Telegram Bot Stub/Mock
function notifyTelegramBot(serviceName, oldStatus, newStatus) {
    console.log(`[TELEGRAM ALERT 🚨] Service ${serviceName} changed status from ${oldStatus} to ${newStatus}`);
    // Future implementation: Send HTTP request to Telegram Bot API
}

// Rota para forçar atualização imediata (limpa o cache)
app.post('/api/refresh', (req, res) => {
    cache.flushAll();
    console.log('[CACHE] Cache limpo manualmente via /api/refresh');
    res.json({ ok: true, message: 'Cache limpo. Próxima requisição buscará dados frescos.' });
});

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
