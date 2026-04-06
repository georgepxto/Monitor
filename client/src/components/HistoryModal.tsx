import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, History, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { IncidentHistoryItem } from '../types';

interface Props {
  serviceName: string;
  onClose: () => void;
}

export function HistoryModal({ serviceName, onClose }: Props) {
  const [incidents, setIncidents] = useState<IncidentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await axios.get(`${API_URL}/api/history/${encodeURIComponent(serviceName)}`);
        setIncidents(response.data);
      } catch (err: any) {
        console.error('Failed to fetch history', err);
        setError(err.response?.data?.error || 'Erro ao carregar o histórico deste serviço.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [serviceName]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl mb-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Histórico de Incidentes</h2>
              <p className="text-sm text-gray-400">{serviceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border border-gray-800 rounded-xl border-dashed">
              <p className="font-medium text-gray-300">Nenhum incidente nos últimos 2 dias</p>
              <p className="text-sm mt-1">Este serviço operou normalmente no período.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => {
                const isResolved = incident.status === 'resolved';
                
                let dateStarted = '';
                let dateResolved = '';
                
                try {
                    const formatBrTimezone = (isoStr: string) => {
                      const d = new Date(isoStr);
                      const dPart = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' }).replace('.', '');
                      const tPart = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
                      return `${dPart}, ${tPart}`;
                    };
                    dateStarted = formatBrTimezone(incident.created_at);
                    if (incident.resolved_at) {
                        dateResolved = formatBrTimezone(incident.resolved_at);
                    }
                } catch(e) {}

                return (
                  <div key={incident.id} className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div>
                        <h3 className="text-gray-200 font-semibold mb-1">{incident.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Início: {dateStarted}
                          </span>
                          {dateResolved && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              Fim: {dateResolved}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          isResolved 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {isResolved ? 'Resolvido' : 'Ativo'}
                        </span>
                      </div>
                    </div>
                    {/* Exibe apenas o update mais recente se houver algum */}
                    {incident.incident_updates && incident.incident_updates.length > 0 && incident.incident_updates[0].body && (
                      <div className="mt-3 pt-3 border-t border-gray-700/50 text-sm text-gray-400">
                        <p className="line-clamp-2">{incident.incident_updates[0].body}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
