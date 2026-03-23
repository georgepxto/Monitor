export type ServiceStatus = 'Verde' | 'Amarelo' | 'Vermelho';

export interface Service {
    name: string;
    group: string;
    status: ServiceStatus;
    lastUpdated: string;
    description?: string;
    link?: string;
    reportCount?: number;
    newsArticles?: {
        title: string;
        url: string;
        source: string;
    }[];
    error?: boolean;
    mocked?: boolean;
}
