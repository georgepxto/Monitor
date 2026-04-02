import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import type { Service } from '../types';
import { StatusCard } from './StatusCard';
import { GlossaryModal } from './GlossaryModal';
import { HistoryModal } from './HistoryModal';
import { RefreshCw, Activity, Server, Building2, AlertCircle, BookOpen } from 'lucide-react';

export function StatusDashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [selectedHistoryService, setSelectedHistoryService] = useState<string | null>(null);
  const prevStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const fetchStatuses = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        // Limpa o cache do servidor para garantir dados frescos
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          await axios.post(`${API_URL}/api/refresh`);
        } catch (_) { /* silencia erro de cache clear */ }
      }
      setError(null);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/status`);
      const fetchedServices: Service[] = response.data;

      // Notification Logic
      const targetedServices = ['Livechat', 'Betconstruct', 'Legitimuz'];
      fetchedServices.forEach(service => {
        if (targetedServices.includes(service.name)) {
          const prevStatus = prevStatusRef.current[service.name];
          // Se o status anterior era Verde e agora mudou para algo diferente, notifica
          if (prevStatus && prevStatus === 'Verde' && service.status !== 'Verde') {
            if ('Notification' in window && Notification.permission === 'granted') {
              new window.Notification(`⚠️ Problema Detectado: ${service.name}`, {
                body: `O serviço ${service.name} reportou um problema. Status atual: ${service.status}.`,
              });
            }
          }
        }
        // Atualiza a referência
        prevStatusRef.current[service.name] = service.status;
      });

      setServices(fetchedServices);
    } catch (err) {
      console.error('Failed to fetch statuses', err);
      setError('Não foi possível carregar o status dos serviços. O servidor pode estar offline.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    // 5 minutes polling
    const interval = setInterval(() => {
      fetchStatuses(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchStatuses]);

  // Group services
  const groupedServices = services.reduce((acc, service) => {
    const group = service.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-12 h-12 text-green-500 animate-spin mb-4" />
        <p className="text-gray-400">Carregando status dos serviços...</p>
      </div>
    );
  }

  const getGroupIcon = (groupName: string) => {
    switch (groupName) {
      case 'Sistemas': return <Activity className="w-5 h-5" />;
      case 'Infraestrutura': return <Server className="w-5 h-5" />;
      case 'Bancos': return <Building2 className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <>
    <div className="space-y-12 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 tracking-tight">Status dos Serviços</h1>
          <p className="text-gray-400 mt-1">Acompanhe em tempo real a integridade das integrações.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowGlossary(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg border border-gray-700 transition-colors text-sm"
            title="Ver glossário de status e incidentes"
          >
            <BookOpen className="w-4 h-4" />
            Glossário
          </button>
          <button 
            onClick={() => fetchStatuses(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2.5 rounded-lg border border-gray-700 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-green-400' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar Agora'}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-sm text-gray-400">
        <span className="text-yellow-500/80 mt-0.5 flex-shrink-0">⚠️</span>
        <p>
          As informações exibidas são obtidas automaticamente de fontes públicas e podem não refletir a situação em tempo real com 100% de precisão.{' '}
          <span className="text-gray-300">Sempre verifique o status oficial pelo link "Acessar Fonte" em cada card antes de tomar qualquer decisão.</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!error && Object.entries(groupedServices).map(([groupName, groupServices]) => (
        <div key={groupName} className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
            <div className="text-green-500">
              {getGroupIcon(groupName)}
            </div>
            <h2 className="text-xl font-semibold text-gray-200">{groupName}</h2>
            <span className="ml-2 bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">{groupServices.length}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {groupServices.map((service, idx) => (
              <StatusCard 
                key={`${service.name}-${idx}`} 
                service={service} 
                onShowHistory={(s) => setSelectedHistoryService(s.name)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>

    {showGlossary && <GlossaryModal onClose={() => setShowGlossary(false)} />}
    {selectedHistoryService && (
      <HistoryModal 
        serviceName={selectedHistoryService} 
        onClose={() => setSelectedHistoryService(null)} 
      />
    )}
    </>
  );
}
