
import React, { useMemo, useState } from 'react';
import { FinanceAccount, Transaction, CreditCard as CardType, Receivable, DashboardWidgetConfig } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Target, Plus, EyeOff, Eye, Settings, X, PiggyBank, ArrowLeftRight, List } from 'lucide-react';
import { getSystemConfig } from '../services/logic';

interface FinanceDashboardProps {
  accounts: FinanceAccount[];
  transactions: Transaction[];
  cards: CardType[];
  receivables?: Receivable[];
  darkMode?: boolean;
  hideValues: boolean;
  config: DashboardWidgetConfig;
  onToggleHide: () => void;
  onUpdateConfig: (cfg: DashboardWidgetConfig) => void;
  onNavigate: (tab: string) => void;
}

const formatCurrency = (val: number, hidden: boolean) => {
    if (hidden) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const StatCard = ({ title, value, icon: Icon, type, darkMode }: any) => {
  let iconColor = darkMode ? 'text-cyan-400 bg-cyan-900/30' : 'text-gray-600 bg-gray-100';
  let valueColor = darkMode ? 'text-white' : 'text-gray-900';
  
  const containerClass = darkMode 
    ? 'bg-slate-900 border-slate-800' 
    : 'bg-white border-gray-200 shadow-sm hover:shadow-md';

  if (type === 'positive') {
    iconColor = darkMode ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50';
    valueColor = darkMode ? 'text-emerald-400' : 'text-emerald-700';
  } else if (type === 'negative') {
    iconColor = darkMode ? 'text-red-400 bg-red-500/10' : 'text-red-600 bg-red-50';
    valueColor = darkMode ? 'text-red-400' : 'text-red-700';
  }

  return (
    <div className={`${containerClass} border p-6 rounded-xl flex items-center gap-4 transition-all`}>
      <div className={`p-3 rounded-lg ${iconColor}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{title}</p>
        <h3 className={`text-2xl font-bold ${valueColor}`}>{value}</h3>
      </div>
    </div>
  );
};

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ accounts, transactions, cards, receivables = [], darkMode, hideValues, config, onToggleHide, onUpdateConfig, onNavigate }) => {
  const [showConfig, setShowConfig] = useState(false);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const sysConfig = getSystemConfig();

  // Metrics
  const totalBalance = accounts.reduce((acc, a) => {
      // If setting says exclude, skip non-accounting accounts
      if (!sysConfig.includeNonAccountingInTotal && a.isAccounting === false) return acc;
      return acc + a.balance;
  }, 0);
  
  const hasHiddenAccounts = accounts.some(a => a.isAccounting === false);

  // Total Pendente A Receber
  const totalPendingReceivables = receivables
    .filter(r => r.status === 'PENDING')
    .reduce((acc, r) => acc + r.value, 0);

  const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncomeMonth = monthlyTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenseMonth = monthlyTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const avgDailyExpense = new Date().getDate() > 0 ? totalExpenseMonth / new Date().getDate() : 0;

  // Chart Data: Cash Flow (Bar)
  const chartData = useMemo(() => {
    const months: any[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const sortKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
      months.push({ name: key, sortKey, entradas: 0, saidas: 0 });
    }
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const bin = months.find(m => m.name === key);
      if (bin) {
        if (t.type === 'INCOME') bin.entradas += t.amount;
        if (t.type === 'EXPENSE') bin.saidas += t.amount;
      }
    });
    return months;
  }, [transactions]);

  // Chart Data: Predicted vs Realized (Area)
  const comparativeData = useMemo(() => {
      const months: any[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const sortKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        months.push({ name: key, sortKey, previsto: 0, realizado: 0 });
      }

      // Realizado (Transactions Income)
      transactions.forEach(t => {
          if (t.type !== 'INCOME') return;
          const d = new Date(t.date);
          const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          const bin = months.find(m => m.name === key);
          if (bin) bin.realizado += t.amount;
      });

      // Previsto (Receivables)
      receivables.forEach(r => {
          if (!r.date) return;
          const d = new Date(r.date);
          const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          const bin = months.find(m => m.name === key);
          if (bin) bin.previsto += r.value;
      });

      return months;
  }, [transactions, receivables]);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const heroCardClass = (baseColor: string, borderColor: string) => {
      if (darkMode) {
          // Metallic Blue Theme Adaptation
          return `bg-slate-900 border border-slate-800 shadow-lg shadow-black/50 hover:bg-slate-800`;
      }
      return `bg-white border-2 border-gray-100 shadow-md hover:shadow-lg hover:border-gray-300`;
  };

  const heroSubTextClass = darkMode ? 'text-slate-500' : 'text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Dashboard Financeiro</h1>
            <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Visão geral consolidada</p>
        </div>
        <div className="flex gap-2">
            <button onClick={onToggleHide} className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                {hideValues ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button onClick={() => setShowConfig(true)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                <Settings size={20} />
            </button>
        </div>
      </div>

      {/* Hero Cards with Gradients */}
      {config.showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: A RECEBER */}
            <div 
                onClick={() => onNavigate('fin_receivables')}
                className={`${heroCardClass('from-blue-600/20', 'border-blue-500/30')} p-6 rounded-xl transition-all cursor-pointer group`}
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-sm font-bold uppercase ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`}>A Receber (Master)</h3>
                    <PiggyBank size={20} className={`${darkMode ? 'text-cyan-500' : 'text-blue-500'} opacity-70 group-hover:scale-110 transition-transform`} />
                </div>
                <p className={`text-3xl font-bold ${darkMode ? 'text-cyan-500' : 'text-blue-700'}`}>{formatCurrency(totalPendingReceivables, hideValues)}</p>
                <p className={`text-xs mt-2 ${heroSubTextClass}`}>Gerenciar comissões e entradas</p>
            </div>

            {/* Card 2: DISTRIBUIÇÃO */}
            <div 
                onClick={() => onNavigate('fin_distribution')}
                className={`${heroCardClass('from-purple-600/20', 'border-purple-500/30')} p-6 rounded-xl transition-all cursor-pointer group`}
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-sm font-bold uppercase ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Distribuição</h3>
                    <ArrowLeftRight size={20} className={`${darkMode ? 'text-purple-500' : 'text-purple-500'} opacity-70 group-hover:scale-110 transition-transform`} />
                </div>
                <p className={`text-xl font-bold ${darkMode ? 'text-purple-500' : 'text-purple-700'}`}>Distribuir Valores</p>
                <p className={`text-xs mt-2 ${heroSubTextClass}`}>Repassar para PJ, PF e Cartão</p>
            </div>

            {/* Card 3: LANÇAMENTOS */}
            <div 
                onClick={() => onNavigate('fin_transactions')}
                className={`${heroCardClass('from-emerald-600/20', 'border-emerald-500/30')} p-6 rounded-xl transition-all cursor-pointer group`}
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-sm font-bold uppercase ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Extrato</h3>
                    <List size={20} className={`${darkMode ? 'text-emerald-500' : 'text-emerald-500'} opacity-70 group-hover:scale-110 transition-transform`} />
                </div>
                <p className={`text-xl font-bold ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>Ver Lançamentos</p>
                <p className={`text-xs mt-2 ${heroSubTextClass}`}>Consulte o histórico completo</p>
            </div>
          </div>
      )}

      {/* Stats Grid */}
      {config.showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title={
                    <span className="flex items-center gap-1">
                        Patrimônio {hasHiddenAccounts && !sysConfig.includeNonAccountingInTotal && <EyeOff size={12}/>}
                    </span>
                } 
                value={formatCurrency(totalBalance, hideValues)} 
                icon={Wallet} 
                type={totalBalance >= 0 ? 'positive' : 'negative'} 
                darkMode={darkMode} 
            />
            <StatCard title="Entradas (Mês)" value={formatCurrency(totalIncomeMonth, hideValues)} icon={TrendingUp} type="positive" darkMode={darkMode} />
            <StatCard title="Saídas (Mês)" value={formatCurrency(totalExpenseMonth, hideValues)} icon={TrendingDown} type="negative" darkMode={darkMode} />
            <StatCard title="Gasto Médio/Dia" value={formatCurrency(avgDailyExpense, hideValues)} icon={DollarSign} type="neutral" darkMode={darkMode} />
          </div>
      )}

      {(config.showCharts || config.showRecents) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Chart: Cash Flow */}
              {config.showCharts && (
                  <div className={`rounded-xl p-6 min-w-0 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                     <h2 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Fluxo de Caixa (Entradas vs Saídas)</h2>
                     <div className="h-64 w-full">
                        {hideValues ? (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                <EyeOff size={32} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="99%" height="100%">
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                                <XAxis dataKey="name" stroke={darkMode ? "#94a3b8" : "#64748b"} tickLine={false} axisLine={false} />
                                <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} tickFormatter={(val) => `R$${val/1000}k`} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: darkMode ? '#0f172a' : '#fff', 
                                        borderColor: darkMode ? '#334155' : '#e2e8f0', 
                                        color: darkMode ? '#fff' : '#0f172a',
                                        borderRadius: '8px'
                                    }}
                                    itemStyle={{ color: darkMode ? '#cbd5e1' : '#475569' }}
                                />
                                <Legend />
                                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                        )}
                     </div>
                  </div>
              )}

              {/* Secondary Chart: Forecast vs Realized */}
              {config.showCharts && (
                  <div className={`rounded-xl p-6 min-w-0 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                     <h2 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Previsto (A Receber) vs Realizado</h2>
                     <div className="h-64 w-full">
                        {hideValues ? (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                <EyeOff size={32} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="99%" height="100%">
                              <AreaChart data={comparativeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                                <XAxis dataKey="name" stroke={darkMode ? "#94a3b8" : "#64748b"} tickLine={false} axisLine={false} />
                                <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} tickFormatter={(val) => `R$${val/1000}k`} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: darkMode ? '#0f172a' : '#fff', 
                                        borderColor: darkMode ? '#334155' : '#e2e8f0', 
                                        color: darkMode ? '#fff' : '#0f172a',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="previsto" name="Previsto (Master)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrev)" />
                                <Area type="monotone" dataKey="realizado" name="Realizado (Caixa)" stroke="#10b981" fillOpacity={1} fill="url(#colorReal)" />
                                <defs>
                                    <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                              </AreaChart>
                            </ResponsiveContainer>
                        )}
                     </div>
                  </div>
              )}
          </div>
      )}

      {/* Recent Transactions List */}
      {config.showRecents && (
          <div className={`rounded-xl p-6 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recentes</h2>
              <div className="space-y-3">
                {recentTransactions.map(t => (
                    <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                        <div className="min-w-0 mr-4">
                            <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.description}</p>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {new Date(t.date).toLocaleDateString('pt-BR')} • {t.personType} {t.subcategory && `• ${t.subcategory}`}
                            </p>
                        </div>
                        <p className={`text-sm font-bold whitespace-nowrap ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount, hideValues)}
                        </p>
                    </div>
                ))}
                {recentTransactions.length === 0 && (
                    <p className={`text-center py-8 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Sem movimentações.</p>
                )}
              </div>
          </div>
      )}

      {/* CONFIG MODAL */}
      {showConfig && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-6 w-full max-w-sm shadow-2xl`}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Personalizar Dashboard</h3>
                      <button onClick={() => setShowConfig(false)}><X className="text-gray-500 hover:text-gray-700"/></button>
                  </div>
                  <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5">
                          <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Mostrar Cartões de Resumo</span>
                          <input type="checkbox" checked={config.showStats} onChange={e => onUpdateConfig({...config, showStats: e.target.checked})} className="w-5 h-5 rounded text-purple-600"/>
                      </label>
                      <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5">
                          <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Mostrar Gráficos</span>
                          <input type="checkbox" checked={config.showCharts} onChange={e => onUpdateConfig({...config, showCharts: e.target.checked})} className="w-5 h-5 rounded text-purple-600"/>
                      </label>
                      <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5">
                          <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Mostrar Lista Recente</span>
                          <input type="checkbox" checked={config.showRecents} onChange={e => onUpdateConfig({...config, showRecents: e.target.checked})} className="w-5 h-5 rounded text-purple-600"/>
                      </label>
                  </div>
                  <button onClick={() => setShowConfig(false)} className="w-full mt-6 py-2 bg-purple-600 text-white rounded-lg font-bold">Concluir</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
