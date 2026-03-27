const axios = require('axios');
const Parser = require('rss-parser');
const rssParser = new Parser();

// Group 1: Statuspage APIs
const statuspageServices = [
    { name: 'Betconstruct', url: 'https://status.betconstruct.com/api/v2/status.json', group: 'Sistemas', checkBackoffice: true },
    { name: 'Livechat', url: 'https://status.livechat.com/api/v2/status.json', group: 'Sistemas' },
    { name: 'BTG Pactual Empresas', url: 'https://status.empresas.btgpactual.com/api/v2/status.json', group: 'Bancos' },
    { name: 'Legitimuz', url: 'https://legitimuz.statuspage.io/api/v2/status.json', group: 'Sistemas' },
    { name: 'Cloudflare', url: 'https://www.cloudflarestatus.com/api/v2/status.json', group: 'Infraestrutura' }
];

// Palavras-chave que indicam problemas críticos para a operação (backoffice)
const CRITICAL_KEYWORDS = ['backoffice', 'back office', 'back-office'];

function hasBackofficeKeyword(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return CRITICAL_KEYWORDS.some(kw => lower.includes(kw));
}

function mapStatuspageStatus(indicator) {
    if (indicator === 'none') return 'Verde';
    if (indicator === 'minor') return 'Amarelo';
    if (indicator === 'maintenance') return 'Amarelo'; // Manutenção programada ≠ queda
    return 'Vermelho';
}

async function fetchStatuspage(service) {
    try {
        const summaryUrl = service.url.replace('/status.json', '/summary.json');
        const response = await axios.get(summaryUrl, { timeout: 8000 });
        const data = response.data;
        const indicator = data.status.indicator;
        let status = mapStatuspageStatus(indicator);
        const link = data.page.url || service.url.replace('/api/v2/status.json', '');

        let description = undefined;
        let backofficeAlert = undefined;

        if (indicator === 'maintenance') {
            // Busca manutenções ativas para exibir a descrição correta
            const maintenances = data.scheduled_maintenances || [];
            const activeMaintenance = maintenances.find(m => m.status === 'in_progress') || maintenances[0];
            if (activeMaintenance) {
                const latestUpdate = activeMaintenance.incident_updates?.[0];
                description = latestUpdate
                    ? `🔧 Manutenção em andamento: ${latestUpdate.body}`
                    : `🔧 Manutenção em andamento: ${activeMaintenance.name}`;
            } else {
                description = `🔧 ${data.status.description || 'Manutenção programada em andamento.'}`;
            }
        } else if (status !== 'Verde' && data.incidents && data.incidents.length > 0) {
            const latestIncident = data.incidents[0];
            const latestUpdate = latestIncident.incident_updates?.[0];
            description = latestUpdate
                ? `${latestIncident.name}: ${latestUpdate.body}`
                : latestIncident.name;
        } else if (status !== 'Verde') {
            description = data.status.description;
        }

        // --- Detecção de incidentes relacionados ao Backoffice ---
        // Mesmo que o status geral seja Verde, verifica se há algum incident ativo
        // que mencione backoffice no nome ou nos componentes afetados.
        if (service.checkBackoffice && data.incidents && data.incidents.length > 0) {
            const backofficeIncident = data.incidents.find(incident => {
                // Checa o nome do incidente
                if (hasBackofficeKeyword(incident.name)) return true;
                // Checa os componentes afetados
                if (incident.components?.some(c => hasBackofficeKeyword(c.name))) return true;
                // Checa o body do update mais recente
                const latestUpdate = incident.incident_updates?.[0];
                if (hasBackofficeKeyword(latestUpdate?.body)) return true;
                return false;
            });

            if (backofficeIncident) {
                // Eleva o status para pelo menos Amarelo e adiciona alerta
                if (status === 'Verde') status = 'Amarelo';
                const latestUpdate = backofficeIncident.incident_updates?.[0];
                backofficeAlert = latestUpdate
                    ? `⚠️ Backoffice: ${backofficeIncident.name} — ${latestUpdate.body}`
                    : `⚠️ Backoffice com problema: ${backofficeIncident.name}`;
                console.log(`[BACKOFFICE ALERT] ${service.name}: ${backofficeIncident.name}`);
            }
        }

        return {
            name: service.name,
            group: service.group,
            status,
            lastUpdated: data.page.updated_at || new Date().toISOString(),
            description: backofficeAlert || description,
            backofficeAlert: !!backofficeAlert,
            link,
            isMaintenance: indicator === 'maintenance'
        };
    } catch (error) {
        console.error(`Error fetching ${service.name}:`, error.message);
        return {
            name: service.name,
            group: service.group,
            status: 'Vermelho',
            lastUpdated: new Date().toISOString(),
            description: `Falha ao conectar com a API de status: ${error.message}`,
            link: service.url.replace('/api/v2/status.json', ''),
            error: true
        };
    }
}


// Group 2: AWS (RSS)
async function fetchAWS() {
    try {
        const feed = await rssParser.parseURL('https://status.aws.amazon.com/rss/all.rss');
        const now = new Date();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        const activeIssues = feed.items.filter(item => {
            const pubDate = item.pubDate ? new Date(item.pubDate) : null;
            if (!pubDate || (now - pubDate) > TWENTY_FOUR_HOURS) return false;
            const title = (item.title || '').toLowerCase();
            const content = (item.contentSnippet || item.content || '').toLowerCase();
            if (title.includes('resolved') || content.includes('resolved') ||
                title.includes('[resolved]') ||
                title.includes('service is operating normally') ||
                content.includes('service is operating normally')) {
                return false;
            }
            return true;
        });

        const hasActiveIssues = activeIssues.length > 0;
        return {
            name: 'AWS',
            group: 'Infraestrutura',
            status: hasActiveIssues ? 'Amarelo' : 'Verde',
            lastUpdated: feed.lastBuildDate || new Date().toISOString(),
            description: hasActiveIssues ? activeIssues[0].title : undefined,
            link: hasActiveIssues ? (activeIssues[0].link || 'https://health.aws.amazon.com/health/status') : 'https://health.aws.amazon.com/health/status'
        };
    } catch (error) {
        console.error('Error fetching AWS:', error.message);
        return {
            name: 'AWS',
            group: 'Infraestrutura',
            status: 'Amarelo',
            lastUpdated: new Date().toISOString(),
            description: `Falha ao processar RSS da AWS Health: ${error.message}`,
            link: 'https://health.aws.amazon.com/health/status',
            error: true
        };
    }
}

// ============================================================
// Group 3: Banks + PIX — Social/News Sentiment Analysis
// ============================================================
// Uses Google News RSS to search for keywords like
// "[service] fora do ar", "caiu", "instabilidade", "problema"
// in recent news/social media posts (in Portuguese).
//
// Google News indexes tweets, Reddit posts, and news articles
// so this captures the same signal as a Twitter scraper.
//
// Thresholds:
//   - 3+ articles in last 3 hours → Amarelo (instability likely)
//   - 6+ articles in last 3 hours → Vermelho (confirmed outage)
// ============================================================

const newsMonitoredServices = [
    {
        name: 'PIX',
        keywords: 'pix fora do ar OR pix caiu OR pix instabilidade OR pix problema hoje',
        ddSlug: 'pix',
        group: 'Bancos'
    },
    {
        name: 'Nubank',
        keywords: 'nubank fora do ar OR nubank caiu OR nubank instabilidade OR nubank app problema',
        ddSlug: 'nubank',
        group: 'Bancos'
    },
    {
        name: 'Itaú',
        keywords: 'itau fora do ar OR itau caiu OR itau instabilidade OR itau app problema',
        ddSlug: 'banco-itau',
        group: 'Bancos'
    },
    {
        name: 'Bradesco',
        keywords: 'bradesco fora do ar OR bradesco caiu OR bradesco instabilidade OR bradesco app problema',
        ddSlug: 'bradesco',
        group: 'Bancos'
    },
    {
        name: 'Caixa',
        keywords: 'caixa fora do ar OR caixa caiu OR caixa instabilidade OR caixa app problema',
        ddSlug: 'caixa',
        group: 'Bancos'
    },
    {
        name: 'Banco do Brasil',
        keywords: 'banco do brasil fora do ar OR banco do brasil caiu OR bb instabilidade OR bb app problema',
        ddSlug: 'banco-do-brasil',
        group: 'Bancos'
    },
    {
        name: 'Santander',
        keywords: 'santander fora do ar OR santander caiu OR santander instabilidade OR santander app problema',
        ddSlug: 'santander',
        group: 'Bancos'
    }
];

async function fetchNewsSentiment(service) {
    const ddLink = `https://downdetector.com.br/fora-do-ar/${service.ddSlug}/`;

    try {
        const query = encodeURIComponent(service.keywords);
        const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

        const feed = await rssParser.parseURL(rssUrl);
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;

        // Apenas artigos da última 1 hora
        // Usa isoDate (mais confiável) com fallback para pubDate
        // Artigos sem data válida são REJEITADOS (evita artigos antigos reindexados)
        const recentArticles = feed.items.filter(item => {
            const rawDate = item.isoDate || item.pubDate;
            if (!rawDate) return false; // sem data → rejeita

            const ts = new Date(rawDate).getTime();
            if (isNaN(ts)) return false; // data inválida → rejeita

            return (now - ts) < ONE_HOUR;
        });

        const recentCount = recentArticles.length;

        // Se não há notícias na última hora → tudo ok
        let status = 'Verde';
        let description = undefined;

        if (recentCount >= 5) {
            status = 'Vermelho';
            description = `${recentCount} notícias na última hora relatam problemas graves.`;
        } else if (recentCount >= 2) {
            status = 'Amarelo';
            description = `${recentCount} notícias na última hora relatam instabilidade.`;
        }

        // Exibe até 3 artigos únicos apenas se houver notícias recentes
        const uniqueUrls = new Set();
        const newsArticles = [];

        for (const article of recentArticles) {
            if (newsArticles.length >= 3) break;
            if (!uniqueUrls.has(article.link)) {
                uniqueUrls.add(article.link);
                newsArticles.push({
                    title: article.title,
                    url: article.link,
                    source: article.creator || article.source || 'Portal de Notícias'
                });
            }
        }

        console.log(`[News] ${service.name}: ${recentCount} artigo(s) na última 1h → ${status}`);

        return {
            name: service.name,
            group: service.group,
            status,
            lastUpdated: new Date().toISOString(),
            description,
            reportCount: recentCount,
            newsArticles: newsArticles.length > 0 ? newsArticles : undefined,
            link: ddLink
        };
    } catch (error) {
        console.error(`Error fetching news for ${service.name}:`, error.message);
        return {
            name: service.name,
            group: service.group,
            status: 'Verde',
            lastUpdated: new Date().toISOString(),
            reportCount: 0,
            link: ddLink
        };
    }
}


async function fetchAllStatuses(cache, notifyTelegramBot) {
    const promises = [
        ...statuspageServices.map(fetchStatuspage),
        fetchAWS(),
        ...newsMonitoredServices.map(fetchNewsSentiment)
    ];

    const results = await Promise.all(promises);

    // Check for status changes to trigger Telegram notifications
    const previousStatuses = cache.get('last_known_statuses') || {};
    const newKnownStatuses = {};

    results.forEach(service => {
        newKnownStatuses[service.name] = service.status;
        const oldStatus = previousStatuses[service.name];
        if (oldStatus && oldStatus === 'Verde' && service.status !== 'Verde') {
            notifyTelegramBot(service.name, oldStatus, service.status);
        } else if (oldStatus && oldStatus !== 'Verde' && service.status === 'Verde') {
            notifyTelegramBot(service.name, oldStatus, service.status);
        }
    });

    cache.set('last_known_statuses', newKnownStatuses, 3600);
    return results;
}

module.exports = {
    fetchAllStatuses
};
