import { X, BookOpen, AlertTriangle, CheckCircle2, XCircle, Wrench, ShieldAlert } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const STATUS_GLOSSARY = [
  {
    icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    badge: { label: 'Operacional', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    title: 'Operacional',
    description: 'O serviço está funcionando normalmente. Nenhuma ação necessária.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    badge: { label: 'Instabilidade', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    title: 'Instabilidade',
    description: 'O serviço está com desempenho degradado ou funcionamento parcial. Pode haver lentidão, erros intermitentes ou funcionalidades específicas indisponíveis.',
  },
  {
    icon: <Wrench className="w-5 h-5 text-blue-400" />,
    badge: { label: 'Manutenção', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    title: 'Manutenção Programada',
    description: 'O provedor está realizando uma manutenção planejada. Não é uma queda — é um período temporário com funcionalidade reduzida ou inativa. Aguardar a conclusão.',
  },
  {
    icon: <ShieldAlert className="w-5 h-5 text-orange-400" />,
    badge: { label: 'Alerta Backoffice', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    title: '⚠️ Alerta Operacional — Backoffice',
    description: 'Há um incidente ativo que afeta diretamente o Backoffice. Isso impede ou prejudica gravemente as operações internas (logins, relatórios, depósitos via BO, etc.).',
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    badge: { label: 'Fora do Ar', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    title: 'Fora do Ar',
    description: 'O serviço está completamente indisponível ou inacessível. Há uma queda crítica em andamento.',
  },
];

const BC_GLOSSARY = [
  {
    component: 'Backoffice / BackOffice Panel',
    impact: 'CRÍTICO',
    impactColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    description: 'Painel principal de gestão da BetConstruct. Se estiver com problema, não é possível acessar relatórios, gerenciar jogadores, processar pagamentos manuais ou configurar nada no sistema.',
    whatToDo: 'Aguardar resolução. Verificar status em status.betconstruct.com. Anotar horário do incidente para referência.',
  },
  {
    component: 'Backoffice Login Issue',
    impact: 'CRÍTICO',
    impactColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    description: 'Impossível fazer login no Backoffice. Bloqueia completamente o acesso à gestão da plataforma.',
    whatToDo: 'Todos os usuários do BO serão afetados. Não há workaround. Apenas aguardar a resolução do provedor.',
  },
  {
    component: 'BackOffice Replication Issue',
    impact: 'ALTO',
    impactColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    description: 'Problema na replicação de dados no Backoffice. Os dados exibidos podem estar desatualizados (saldos, apostas, transações). O sistema pode parecer funcionar, mas os dados não são confiáveis.',
    whatToDo: 'Não tomar decisões baseadas em dados do BO durante o incidente. Aguardar estabilização.',
  },
  {
    component: 'Backoffice Deposit Request',
    impact: 'CRÍTICO',
    impactColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    description: 'Impossível processar ou aprovar solicitações de depósito via Backoffice. Afeta diretamente o fluxo de recarga de saldo dos clientes.',
    whatToDo: 'Pausar aprovações manuais de depósito. Comunicar equipe financeira. Aguardar resolução.',
  },
  {
    component: 'Payments System',
    impact: 'CRÍTICO',
    impactColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    description: 'Sistema de pagamentos com problema. Depósitos e/ou saques podem não ser processados corretamente, tanto pela plataforma quanto pelo Backoffice.',
    whatToDo: 'Monitorar transações pendentes. Não aprovar saques manualmente até estabilização. Comunicar suporte BC.',
  },
  {
    component: 'Casino Platform / Casino Bets Placement',
    impact: 'ALTO',
    impactColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    description: 'Plataforma de cassino com instabilidade. Jogos podem não carregar, apostas podem não ser registradas ou o lobby pode estar inacessível para os jogadores.',
    whatToDo: 'Verificar se jogadores estão relatando problemas. Aguardar normalização da plataforma.',
  },
  {
    component: 'Casino Bet Settlement',
    impact: 'ALTO',
    impactColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    description: 'Liquidação (pagamento) de apostas de cassino com problema. Apostas ganhas podem não estar sendo pagas automaticamente.',
    whatToDo: 'Monitorar reclamações de jogadores sobre prêmios não creditados. Documentar para posterior conciliação.',
  },
  {
    component: 'Sport Bet Settlement',
    impact: 'ALTO',
    impactColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    description: 'Liquidação de apostas esportivas com problema. Resultados de eventos podem não estar sendo processados e apostas vencedoras não estão sendo pagas.',
    whatToDo: 'Verificar apostas pendentes de eventos já encerrados. Abrir ticket de suporte se a demora for maior que 30 minutos.',
  },
  {
    component: 'Website Operation / Site Log in',
    impact: 'ALTO',
    impactColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    description: 'O site dos jogadores está com problema. Pode afetar login, navegação, carregamento de jogos ou registro de novos usuários. Impacto direto na experiência do jogador.',
    whatToDo: 'Verificar se o site do cliente está acessível. Comunicar o time de suporte ao cliente para que esteja ciente.',
  },
  {
    component: '3rd Party Provider',
    impact: 'MÉDIO',
    impactColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    description: 'Um provedor de jogos terceiro (ex: PG Soft, Pragmatic Play, JDB) está com problemas ou em manutenção. Jogos desse provedor específico podem estar indisponíveis, mas o restante da plataforma funciona normalmente.',
    whatToDo: 'Identificar qual provedor está afetado. Verificar se há jogos alternativos disponíveis. Comunicar jogadores afetados se necessário.',
  },
  {
    component: 'Bonuses',
    impact: 'MÉDIO',
    impactColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    description: 'Sistema de bônus com instabilidade. Bônus podem não ser concedidos automaticamente, créditos de bônus podem não aparecer ou cancelamentos podem falhar.',
    whatToDo: 'Pausar campanhas de bônus automáticas se possível. Verificar concessões manuais pendentes após normalização.',
  },
  {
    component: 'CMS (Content Management)',
    impact: 'BAIXO',
    impactColor: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    description: 'Sistema de gerenciamento de conteúdo com problema. Pode afetar banners, promoções exibidas no site e outras configurações de front-end.',
    whatToDo: 'Operações financeiras e de jogo normalmente não são afetadas. Acompanhar resolução sem urgência.',
  },
  {
    component: 'AGP Panel',
    impact: 'ALTO',
    impactColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    description: 'Painel AGP (painel de agências/afiliados) com problema. Gestão de afiliados, sub-agentes e relatórios de comissão podem estar inacessíveis.',
    whatToDo: 'Comunicar equipe de afiliados. Aguardar resolução antes de processar pagamentos de comissão.',
  },
];

export function GlossaryModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl mb-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Glossário de Status</h2>
              <p className="text-sm text-gray-400">O que cada indicador significa para a operação</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* Seção 1: Status Gerais */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Status Gerais do Sistema</h3>
            <div className="space-y-3">
              {STATUS_GLOSSARY.map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                  <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.badge.color}`}>
                        {item.badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Seção 2: BetConstruct */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Incidentes BetConstruct</h3>
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">MAIS IMPORTANTE</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">O que cada tipo de incidente significa e o que fazer quando acontece.</p>

            <div className="space-y-3">
              {BC_GLOSSARY.map((item) => (
                <div key={item.component} className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-bold text-gray-100">{item.component}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.impactColor}`}>
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-2">{item.description}</p>
                  <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-gray-700/50">
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider mt-0.5 flex-shrink-0">O que fazer:</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.whatToDo}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
