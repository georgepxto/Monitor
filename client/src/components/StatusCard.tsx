import type { Service } from '../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Props {
  service: Service;
}

export function StatusCard({ service }: Props) {
  const isGreen = service.status === 'Verde';
  const isYellow = service.status === 'Amarelo';
  const isRed = service.status === 'Vermelho';

  let timeAgo = 'recentemente';
  try {
    timeAgo = formatDistanceToNow(parseISO(service.lastUpdated), { 
      addSuffix: true, 
      locale: ptBR 
    });
  } catch (e) {
    // Falha de parse (se vier data que o backend falhou em processar)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:border-gray-600">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-gray-100 text-lg">{service.name}</h3>
        <div className={twMerge(
          "flex items-center justify-center p-2 rounded-full",
          isGreen && "bg-green-500/10 text-green-500",
          isYellow && "bg-yellow-500/10 text-yellow-500",
          isRed && "bg-red-500/10 text-red-500"
        )}>
          {isGreen && <CheckCircle2 className="w-6 h-6" />}
          {isYellow && <AlertTriangle className="w-6 h-6" />}
          {isRed && <XCircle className="w-6 h-6" />}
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx(
            "text-sm font-medium px-2.5 py-0.5 rounded-full border",
            isGreen && "bg-green-500/10 text-green-400 border-green-500/20",
            isYellow && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            isRed && "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            {isGreen && 'Operacional'}
            {isYellow && 'Instabilidade'}
            {isRed && 'Fora do Ar'}
          </span>
          {service.newsArticles && service.newsArticles.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-900/50 px-2 py-0.5 rounded-full border border-gray-700">
              📰 {service.newsArticles.length} destacada{service.newsArticles.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {(service.description || (service.newsArticles && service.newsArticles.length > 0)) && (!isGreen || (service.newsArticles && service.newsArticles.length > 0)) && (
          <div className="p-3 bg-gray-900/50 rounded-lg text-sm text-gray-300 border border-gray-700 flex flex-col gap-2">
            {service.description && !isGreen && (
              <p className="line-clamp-3 leading-relaxed">
                {service.description}
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

        <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-800/50">
          <span className="text-xs text-gray-400">
            Atualizado {timeAgo}
            {service.mocked && ' (Mock)'}
          </span>
          {service.link && (
            <a 
              href={service.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1.5 text-xs font-medium bg-gray-900/50 px-2 py-1 rounded"
              title="Acessar página de status"
            >
              <span>Acessar Fonte</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
