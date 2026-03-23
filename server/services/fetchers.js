const axios = require('axios');
const Parser = require('rss-parser');
const rssParser = new Parser();

// Group 1: Statuspage APIs
const statuspageServices = [
    { name: 'Betconstruct', url: 'https://status.betconstruct.com/api/v2/status.json', group: 'Sistemas' },
    { name: 'Livechat', url: 'https://status.livechat.com/api/v2/status.json', group: 'Sistemas' },
    { name: 'BTG Pactual Empresas', url: 'https://status.empresas.btgpactual.com/api/v2/status.json', group: 'Bancos' },
    { name: 'Legitimuz', url: 'https://legitimuz.statuspage.io/api/v2/status.json', group: 'Sistemas' },
    { name: 'Cloudflare', url: 'https://www.cloudflarestatus.com/api/v2/status.json', group: 'Infraestrutura' }
];

function mapStatuspageStatus(indicator) {
    if (indicator === 'none') return 'Verde';
    if (indicator === 'minor') return 'Amarelo';
    return 'Vermelho';
}

async function fetchStatuspage(service) {
    try {
        const summaryUrl = service.url.replace('/status.json', '/summary.json');
        const response = await axios.get(summaryUrl, { timeout: 8000 });
        const data = response.data;
        const status = mapStatuspageStatus(data.status.indicator);
        const link = data.page.url || service.url.replace('/api/v2/status.json', '');

        let description = undefined;
        if (status !== 'Verde' && data.incidents && data.incidents.length > 0) {
            const latestIncident = data.incidents[0];
            const latestUpdate = latestIncident.incident_updates?.[0];
            description = latestUpdate
                ? `${latestIncident.name}: ${latestUpdate.body}`
                : latestIncident.name;
        } else if (status !== 'Verde') {
            description = data.status.description;
        }

        return {
            name: service.name,
            group: service.group,
            status,
            lastUpdated: data.page.updated_at || new Date().toISOString(),
            description,
            link
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
        ddSlug: 'itau',
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
        ddSlug: 'caixa-economica-federal',
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
        const THREE_HOURS = 3 * 60 * 60 * 1000;
        const SIX_HOURS = 6 * 60 * 60 * 1000;

        // Filter articles from the last 3 hours
        const recentArticles = feed.items.filter(item => {
            const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : 0;
            return (now - pubDate) < THREE_HOURS;
        });

        // Also count articles from the last 6 hours for context
        const extendedArticles = feed.items.filter(item => {
            const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : 0;
            return (now - pubDate) < SIX_HOURS;
        });

        const recentCount = recentArticles.length;
        const extendedCount = extendedArticles.length;

        let status = 'Verde';
        let description = undefined;
        let latestArticle = recentArticles[0] || extendedArticles[0];

        if (recentCount >= 6) {
            status = 'Vermelho';
            description = `${recentCount} notícias recentes relatam problemas.`;
        } else if (recentCount >= 3) {
            status = 'Amarelo';
            description = `${recentCount} notícias recentes relatam instabilidade.`;
        } else if (extendedCount >= 5) {
            status = 'Amarelo';
            description = `${extendedCount} notícias nas últimas 6h apontam problemas.`;
        }
        
        // Always surface the latest news if there is any, regardless of status
        // Grab up to 3 unique news articles
        const combinedArticles = [...recentArticles, ...extendedArticles];
        const uniqueUrls = new Set();
        const newsArticles = [];
        
        for (const article of combinedArticles) {
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

        console.log(`[News] ${service.name}: ${recentCount} artigos (3h), ${extendedCount} artigos (6h) → ${status}`);

        return {
            name: service.name,
            group: service.group,
            status,
            lastUpdated: new Date().toISOString(),
            description,
            reportCount: recentCount || extendedCount,
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
