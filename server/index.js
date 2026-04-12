require('dotenv').config();
const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { fetchAllStatuses, statuspageServices } = require('./services/fetchers');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

// Initialize cache with 2 minutes standard TTL
const cache = new NodeCache({ stdTTL: 120 });

// Chave secreta para endpoints administrativos (defina ADMIN_KEY no .env)
const ADMIN_KEY = process.env.ADMIN_KEY;

// Middleware: valida API key nos endpoints sensíveis
function requireAdminKey(req, res, next) {
    if (!ADMIN_KEY) {
        // Se não configurada, bloqueia em produção, libera apenas em localhost
        const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
        if (!isLocal) return res.status(403).json({ error: 'Endpoint desabilitado em produção.' });
        return next();
    }
    const key = req.headers['x-admin-key'] || req.body?.adminKey;
    if (key !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Não autorizado.' });
    }
    next();
}

// Limite de conexões SSE simultâneas
const SSE_MAX_CLIENTS = 50;

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
    if (sseClients.length >= SSE_MAX_CLIENTS) {
        return res.status(503).json({ error: 'Muitas conexões ativas. Tente novamente mais tarde.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.push(res);

    // Keep-alive para a conexão do navegador não fechar por timeout
    const keepAlive = setInterval(() => {
        res.write(': keep-alive\n\n');
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

// Rota para forçar atualização imediata (limpa o cache) — protegida
app.post('/api/refresh', requireAdminKey, (req, res) => {
    cache.flushAll();
    console.log('[CACHE] Cache limpo manualmente via /api/refresh');
    res.json({ ok: true, message: 'Cache limpo. Próxima requisição buscará dados frescos.' });
});

// Endpoint EXCLUSIVO de desenvolvimento para testar notificações — protegido
const VALID_STATUSES = ['Verde', 'Amarelo', 'Vermelho', 'Azul', 'Cinza'];
app.post('/api/test-notification', requireAdminKey, (req, res) => {
    let { serviceName, oldStatus, newStatus } = req.body;

    // Sanitização básica de inputs
    serviceName = typeof serviceName === 'string' ? serviceName.slice(0, 100) : 'App de Teste';
    oldStatus = VALID_STATUSES.includes(oldStatus) ? oldStatus : 'Verde';
    newStatus = VALID_STATUSES.includes(newStatus) ? newStatus : 'Vermelho';

    notifyTelegramBot(serviceName, oldStatus, newStatus);
    res.json({ ok: true, message: 'Notificação de teste gerada.' });
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
