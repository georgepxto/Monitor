import type { Service } from '../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink, Wrench, Clock, Newspaper, AlertOctagon, History, CloudOff } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BC_GLOSSARY } from './GlossaryModal';

interface Props {
  service: Service;
  onShowHistory?: (service: Service) => void;
  onShowMaintenance?: (service: Service) => void;
}

export function StatusCard({ service, onShowHistory, onShowMaintenance }: Props) {
  const isGreen = service.status === 'Verde';
  const isYellow = service.status === 'Amarelo';
  const isRed = service.status === 'Vermelho';
  const isBlue = service.status === 'Azul';
  const isGray = service.status === 'Cinza';
  const isMaintenance = service.isMaintenance === true || isBlue;

  let timeAgo = 'recentemente';
  let confirmedAgo = '';
  let issueDuration = '';
  let operationalDuration = '';

  try {
    timeAgo = formatDistanceToNow(parseISO(service.lastUpdated), { 
      addSuffix: true, 
      locale: ptBR 
    });

    if (service.lastConfirmedAt) {
      confirmedAgo = formatDistanceToNow(parseISO(service.lastConfirmedAt), {
        addSuffix: true,
        locale: ptBR,
      });
    }

    if (service.issueStartedAt && service.status !== 'Verde') {
      issueDuration = formatDistanceToNow(parseISO(service.issueStartedAt), {
        locale: ptBR
      });
    } else if (service.operationalSince && service.status === 'Verde') {
      operationalDuration = formatDistanceToNow(parseISO(service.operationalSince), {
        locale: ptBR
      });
    }
  } catch (e) {
    // Falha de parse (se vier data que o backend falhou em processar)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 min-h-[400px] shadow-lg flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:border-gray-600">
      <div className="flex items-start justify-between mb-6">
        <h3 className="font-semibold text-gray-100 text-2xl leading-tight">{service.name}</h3>
        <div className={twMerge(
          "flex items-center justify-center p-2 rounded-full",
          isGreen && "bg-green-500/10 text-green-500",
          isYellow && !isMaintenance && "bg-yellow-500/10 text-yellow-500",
          isMaintenance && "bg-blue-500/10 text-blue-400",
          isRed && "bg-red-500/10 text-red-500",
          isGray && "bg-gray-500/10 text-gray-400"
        )}>
          {isGreen && <CheckCircle2 className="w-6 h-6" />}
          {isYellow && !isMaintenance && <AlertTriangle className="w-6 h-6" />}
          {isMaintenance && <Wrench className="w-6 h-6" />}
          {isRed && <XCircle className="w-6 h-6" />}
          {isGray && <CloudOff className="w-6 h-6" />}
        </div>
      </div>
      
      <div className="flex flex-col gap-5 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={clsx(
            "text-sm font-medium px-2.5 py-0.5 rounded-full border",
            isGreen && "bg-green-500/10 text-green-400 border-green-500/20",
            isYellow && !isMaintenance && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            isMaintenance && "bg-blue-500/10 text-blue-400 border-blue-500/20",
            isRed && "bg-red-500/10 text-red-400 border-red-500/20",
            isGray && "bg-gray-500/10 text-gray-300 border-gray-500/20"
          )}>
            {isGreen && 'Operacional'}
            {isMaintenance && 'Manutenção'}
            {isYellow && !isMaintenance && 'Instabilidade'}
            {isRed && 'Fora do Ar'}
            {isGray && 'Fonte Indisponível'}
          </span>
          {issueDuration && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-900/50 text-gray-300 border-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Há {issueDuration}</span>
            </span>
          )}
          {operationalDuration && isGreen && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-900/50 text-gray-300 border-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Há {operationalDuration}</span>
            </span>
          )}
          {service.newsArticles && service.newsArticles.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-900/50 px-2 py-0.5 rounded-full border border-gray-700 flex items-center gap-1">
              <Newspaper className="w-3 h-3" />
              <span>{service.newsArticles.length} destacada{service.newsArticles.length > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>

        {service.backofficeAlert && (
          <div className="p-5 bg-orange-500/10 rounded-lg border border-orange-500/40 flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Alerta Operacional Crítico</p>
              <p className="text-[11px] text-orange-200 leading-relaxed">Incidentes atuais podem impactar operações severamente. Siga as recomendações abaixo.</p>
            </div>
          </div>
        )}

        {(service.description || (service.activeIncidents && service.activeIncidents.length > 0) || (service.newsArticles && service.newsArticles.length > 0)) && (!isGreen || (service.newsArticles && service.newsArticles.length > 0)) && (
          <div className="p-5 bg-gray-900/50 rounded-lg text-sm text-gray-300 border border-gray-700 flex flex-col gap-2.5">
            {service.activeIncidents && service.activeIncidents.length > 0 && !isGreen ? (
              <div className="flex flex-col gap-3">
                {service.activeIncidents.map((incident, idx) => {
                  const matchingGlossaryItems = service.name === 'Betconstruct' || service.name.includes('Betconstruct')
                    ? BC_GLOSSARY.filter(g => {
                        const keywords = g.component.split('/').map(k => k.trim().toLowerCase());
                        const searchStr = `${incident.name} ${incident.description || ''}`.toLowerCase();
                        return keywords.some(k => searchStr.includes(k));
                      })
                    : [];

                  return (
                  <div key={idx} className="flex flex-col gap-1 pb-3 mb-1 border-b border-gray-700/50 last:border-0 last:pb-0 last:mb-0">
                    <p className="font-semibold text-gray-200">{incident.name}</p>
                    {incident.description && <p className="line-clamp-3 leading-relaxed text-xs">{incident.description}</p>}
                    
                    {matchingGlossaryItems.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {matchingGlossaryItems.map((match, i) => (
                           <div key={i} className="bg-gray-800/80 rounded p-2.5 border border-gray-700">
                             <div className="flex items-center gap-2 mb-2 flex-wrap">
                               <span className="text-xs font-bold text-gray-300">{match.component}</span>
                               <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${match.impactColor}`}>
                                 {match.impact}
                               </span>
                             </div>
                             <div className="pt-2 border-t border-gray-700/50">
                               <span className="block text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">O que fazer:</span>
                               <p className="text-xs text-gray-400 leading-relaxed">{match.whatToDo}</p>
                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            ) : service.description && !isGreen && (
              <p className="line-clamp-3 leading-relaxed">
                {service.description.replace(/^⚠️\s*Backoffice:\s*/i, '').replace(/^⚠️\s*/i, '')}
              </p>
            )}
            {service.newsArticles && service.newsArticles.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1 pointer-events-auto">
                {service.newsArticles.map((article, index) => (
                  <a 
                    key={index}
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-1.5 bg-gray-800 rounded border border-gray-600 hover:border-blue-500 transition-colors group"
                    title="Ler notícia completa"
                  >
                    <div className="flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 font-medium">
                      <ExternalLink className="w-3 h-3" />
                      <span className="text-[10px] uppercase tracking-wider">
                        {index === 0 ? "Notícia Mais Recente" : "Notícia Relacionada"}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-200 line-clamp-1 mt-0.5">{article.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Fonte: {article.source}</p>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mt-auto pt-5 border-t border-gray-800/50">
          <div className="text-xs text-gray-400">
            <p className="whitespace-nowrap">Atualizado {timeAgo}{service.mocked && ' (Mock)'}</p>
            {confirmedAgo && (
              <p className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap">Última confirmação real {confirmedAgo}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 ml-auto w-full sm:w-auto sm:max-w-full">
            {service.maintenanceLink && onShowMaintenance && (
              <button 
                onClick={() => onShowMaintenance(service)}
                className="min-w-0 text-gray-400 hover:text-gray-200 transition-colors flex items-center justify-center gap-1 text-[11px] font-medium bg-gray-900/50 px-2 py-1 rounded whitespace-nowrap"
                title="Ver manutenções programadas"
              >
                <Wrench className="w-3 h-3 shrink-0" />
                <span>Manutenções</span>
              </button>
            )}
            {service.historyLink && onShowHistory && (
              <button 
                onClick={() => onShowHistory(service)}
                className="min-w-0 text-gray-400 hover:text-gray-200 transition-colors flex items-center justify-center gap-1 text-[11px] font-medium bg-gray-900/50 px-2 py-1 rounded whitespace-nowrap"
                title="Histórico de incidentes"
              >
                <History className="w-3 h-3 shrink-0" />
                <span>Histórico</span>
              </button>
            )}
            {service.link && (
              <a 
                href={service.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="min-w-0 text-gray-400 hover:text-gray-200 transition-colors flex items-center justify-center gap-1 text-[11px] font-medium bg-gray-900/50 px-2 py-1 rounded whitespace-nowrap"
                title="Acessar página de status"
              >
                <span>Acessar Fonte</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
