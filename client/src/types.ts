export type ServiceStatus = 'Verde' | 'Amarelo' | 'Vermelho' | 'Azul' | 'Cinza';

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
    isMaintenance?: boolean;
    backofficeAlert?: boolean;
    issueStartedAt?: string;
    operationalSince?: string;
    lastConfirmedAt?: string;
    sourceUnavailable?: boolean;
    historyLink?: string;
    maintenanceLink?: string;
    activeIncidents?: {
        name: string;
        description: string;
    }[];
}

export interface MaintenanceItem {
    id: string;
    name: string;
    status: string;
    created_at: string;
    scheduled_for: string | null;
    scheduled_until: string | null;
    updated_at?: string | null;
    impacted?: string[];
    body?: string;
}

export interface IncidentUpdate {
    id: string;
    body: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface IncidentHistoryItem {
    id: string;
    name: string;
    status: string;
    created_at: string;
    resolved_at: string | null;
    impact: string;
    incident_updates: IncidentUpdate[];
}
