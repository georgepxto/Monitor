import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, CalendarClock, AlertTriangle, Wrench, Clock } from 'lucide-react';
import type { MaintenanceItem } from '../types';

interface Props {
  serviceName: string;
  onClose: () => void;
}

export function MaintenanceModal({ serviceName, onClose }: Props) {
  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMaintenances() {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await axios.get(`${API_URL}/api/maintenance/${encodeURIComponent(serviceName)}`);
        setMaintenances(response.data);
      } catch (err: any) {
        console.error('Failed to fetch maintenances', err);
        setError(err.response?.data?.error || 'Erro ao carregar as manutenções programadas deste serviço.');
      } finally {
        setLoading(false);
      }
    }

    fetchMaintenances();
  }, [serviceName]);

  const orderedMaintenances = [...maintenances].sort((a, b) => {
    const aTime = new Date(a.scheduled_for || a.created_at).getTime();
    const bTime = new Date(b.scheduled_for || b.created_at).getTime();
    return aTime - bTime;
  });

  const formatDateTime = (isoStr: string | null) => {
    if (!isoStr) return '—';
    const date = new Date(isoStr);
    if (Number.isNaN(date.getTime())) return '—';

    const datePart = date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).replace('.', '');

    const timePart = date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${datePart}, ${timePart}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl mb-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CalendarClock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Manutenções Programadas</h2>
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
          ) : maintenances.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border border-gray-800 rounded-xl border-dashed">
              <p className="font-medium text-gray-300">Nenhuma manutenção programada encontrada</p>
              <p className="text-sm mt-1">Este serviço não possui manutenção agendada no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedMaintenances.map((maintenance) => {
                const isInProgress = maintenance.status === 'in_progress';
                const isScheduled = maintenance.status === 'scheduled';

                return (
                  <div key={maintenance.id} className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-gray-200 font-semibold mb-1">{maintenance.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Início: {formatDateTime(maintenance.scheduled_for || maintenance.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Fim: {formatDateTime(maintenance.scheduled_until)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          isInProgress
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : isScheduled
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-gray-500/10 text-gray-300 border-gray-500/20'
                        }`}>
                          {isInProgress ? 'Em andamento' : isScheduled ? 'Agendada' : maintenance.status}
                        </span>
                      </div>
                    </div>

                    {maintenance.body && (
                      <div className="mt-3 pt-3 border-t border-gray-700/50 text-sm text-gray-400">
                        <p className="line-clamp-3 leading-relaxed">{maintenance.body}</p>
                      </div>
                    )}

                    {maintenance.impacted && maintenance.impacted.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Componentes impactados</span>
                        <div className="flex flex-wrap gap-2">
                          {maintenance.impacted.map((item) => (
                            <span key={item} className="text-xs bg-gray-900/70 text-gray-300 border border-gray-700 px-2 py-1 rounded-full">
                              <Wrench className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                              {item}
                            </span>
                          ))}
                        </div>
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
