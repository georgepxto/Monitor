const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { fetchAllStatuses, statuspageServices } = require('./services/fetchers');
const axios = require('axios');

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

// Clientes conectados via SSE (Server-Sent Events)
let sseClients = [];

app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.push(res);

    // Keep-alive para a conexão do navegador não fechar por timeout
    const keepAlive = setInterval(() => {
        res.write(': keep-\n\n');
    }, 20000);

    req.on('close', () => {
        clearInterval(keepAlive);
        sseClients = sseClients.filter(c => c !== res);
    });
});

// Telegram Bot Stub/Mock e Push Notifications
function notifyTelegramBot(serviceName, oldStatus, newStatus) {
    let emoji = '🚨';
    if (newStatus === 'Verde') emoji = '✅';
    else if (newStatus === 'Amarelo') emoji = '⚠️';
    else if (newStatus === 'Azul') emoji = '🔧';

    console.log(`[TELEGRAM ALERT ${emoji}] Service ${serviceName} changed status from ${oldStatus} to ${newStatus}`);
    // Future implementation: Send HTTP request to Telegram Bot API

    // Dispara notificação para os navegadores via Server-Sent Events
    const title = `${emoji} Monitor Hub — ${serviceName}`;
    const body = `Mudou de status: ${oldStatus} ➡️ ${newStatus}`;
    const payload = `data: ${JSON.stringify({ title, body, newStatus })}\n\n`;
    
    sseClients.forEach(client => client.write(payload));
}

// Rota para forçar atualização imediata (limpa o cache)
app.post('/api/refresh', (req, res) => {
    cache.flushAll();
    console.log('[CACHE] Cache limpo manualmente via /api/refresh');
    res.json({ ok: true, message: 'Cache limpo. Próxima requisição buscará dados frescos.' });
});

// Endpoint EXCLUSIVO de desenvolvimento para testar o painel/notificação
app.post('/api/test-notification', (req, res) => {
    const { serviceName, oldStatus, newStatus } = req.body;
    notifyTelegramBot(serviceName || 'App de Teste', oldStatus || 'Verde', newStatus || 'Vermelho');
    res.json({ ok: true, message: 'Notificação de teste gerada no terminal.' });
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

app.get('/api/history/:serviceName', async (req, res) => {
    const serviceName = req.params.serviceName;
    const service = statuspageServices.find(s => s.name === serviceName);
    
    if (!service) {
        return res.status(404).json({ error: 'Serviço não encontrado ou não suporta histórico via API.' });
    }

    try {
        const incidentsUrl = service.url.replace('/api/v2/status.json', '/api/v2/incidents.json');
        const response = await axios.get(incidentsUrl, { timeout: 8000 });
        
        // Retorna apenas os incidentes dos últimos 2 dias ou ainda ativos
        let incidents = response.data.incidents || [];
        
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        incidents = incidents.filter(inc => {
            const created = new Date(inc.created_at);
            const resolved = inc.resolved_at ? new Date(inc.resolved_at) : new Date(); // se não resolvido, usa data atual
            return created >= twoDaysAgo || resolved >= twoDaysAgo;
        });

        res.json(incidents);
    } catch (error) {
        console.error(`Error fetching history for ${serviceName}:`, error.message);
        res.status(500).json({ error: 'Erro ao buscar histórico de incidentes.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
