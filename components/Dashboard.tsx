import React, { useState } from 'react';
import { Sale, ProductType, DashboardWidgetConfig } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Gift, ShoppingBasket, Plus, Calendar, Eye, EyeOff, Settings, X, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
  onNewSale: () => void;
  darkMode?: boolean;
  hideValues: boolean;
  config: DashboardWidgetConfig;
  onToggleHide: () => void;
  onUpdateConfig: (cfg: DashboardWidgetConfig) => void;
}

const formatCurrency = (val: number, hidden: boolean) => {
    if (hidden) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const StatCard: React.FC<{ title: string; value: string; sub: string; icon: React.ReactNode; color: string; darkMode?: boolean }> = ({ title, value, sub, icon, color, darkMode }) => (
  <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border flex items-start space-x-4 transition-all hover:shadow-md`}>
    <div className={`p-3 rounded-lg ${color} text-white shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{title}</p>
      <h3 className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
      <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>{sub}</p>
    </div>
  </div>
);

const FullDashboard: React.FC<DashboardProps> = ({ sales, onNewSale, darkMode, hideValues, config, onToggleHide, onUpdateConfig }) => {
  const [showConfig, setShowConfig] = useState(false);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Filters considering date might be empty
  const basicSalesMonth = sales.filter(s => {
    if (!s.date) return false; // Skip pending
    const d = new Date(s.date);
    return s.type === ProductType.BASICA && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const natalSalesYear = sales.filter(s => {
    if (!s.date) return false; // Skip pending
    const d = new Date(s.date);
    return s.type === ProductType.NATAL && d.getFullYear() === currentYear;
  });

  const allSalesMonth = sales.filter(s => {
    if (!s.date) return false; // Skip pending
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalCommissionMonth = allSalesMonth.reduce((acc, curr) => acc + curr.commissionValueTotal, 0);
  const basicQtyMonth = basicSalesMonth.reduce((acc, curr) => acc + curr.quantity, 0);
  const basicCommissionMonth = basicSalesMonth.reduce((acc, curr) => acc + curr.commissionValueTotal, 0);
  const natalQtyYear = natalSalesYear.reduce((acc, curr) => acc + curr.quantity, 0);
  const natalCommissionYear = natalSalesYear.reduce((acc, curr) => acc + curr.commissionValueTotal, 0);
  const showNatalCard = natalSalesYear.length > 0;

  const chartData = React.useMemo(() => {
    const months = new Map<string, { name: string; basica: number; natal: number; total: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.set(key, { name: d.toLocaleDateString('pt-BR', { month: 'short' }), basica: 0, natal: 0, total: 0 });
    }
    sales.forEach(sale => {
      if (!sale.date) return; // Skip pending
      const d = new Date(sale.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (months.has(key)) {
        const bin = months.get(key)!;
        if (sale.type === ProductType.BASICA) bin.basica += sale.commissionValueTotal; else bin.natal += sale.commissionValueTotal;
        bin.total += sale.commissionValueTotal;
      }
    });
    return Array.from(months.values());
  }, [sales]);

  // Sort: Pending (no date) first, then date descending
  const recentSales = [...sales].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return -1;
      if (!b.date) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
  }).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Visão Geral</h1>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Competência: {capitalizedMonth} / {currentYear}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={onToggleHide} className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                {hideValues ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button onClick={() => setShowConfig(true)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                <Settings size={20} />
            </button>
            <button onClick={onNewSale} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center shadow-sm transition-colors">
                <Plus size={20} className="mr-2" /> Nova Venda
            </button>
        </div>
      </div>
      {config.showStats && (
          <div className={`grid grid-cols-1 ${showNatalCard ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            <StatCard title={`Comissão Estimada (${capitalizedMonth})`} value={formatCurrency(totalCommissionMonth, hideValues)} sub="Previsão de recebimento mensal" icon={<DollarSign size={24} />} color="bg-slate-700" darkMode={darkMode} />
            <StatCard title={`Cesta Básica (${capitalizedMonth})`} value={formatCurrency(basicCommissionMonth, hideValues)} sub={`${basicQtyMonth} cestas vendidas no mês`} icon={<ShoppingBasket size={24} />} color="bg-emerald-500" darkMode={darkMode} />
            {showNatalCard && (<StatCard title={`Natal (${currentYear})`} value={formatCurrency(natalCommissionYear, hideValues)} sub={`${natalQtyYear} cestas (Acumulado Ano)`} icon={<Gift size={24} />} color="bg-red-500" darkMode={darkMode} />)}
          </div>
      )}
      {(config.showCharts || config.showRecents) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {config.showCharts && (
                <div className={`lg:col-span-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border min-w-0 relative`}>
                  <h3 className={`text-lg font-semibold mb-6 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}><Calendar className={`w-4 h-4 mr-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}/> Evolução de Comissões (12 Meses)</h3>
                  <div className="h-72 w-full">{hideValues ? (<div className="h-full flex items-center justify-center text-slate-500"><EyeOff size={32} /></div>) : (<ResponsiveContainer width="99%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f0f0f0'} /><XAxis dataKey="name" fontSize={12} tick={{fill: darkMode ? '#94a3b8' : '#6b7280'}} axisLine={false} tickLine={false} /><YAxis fontSize={12} tickFormatter={(val) => `R$${val}`} tick={{fill: darkMode ? '#94a3b8' : '#6b7280'}} axisLine={false} tickLine={false} width={80} /><Tooltip formatter={(value: number) => formatCurrency(value, false)} contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', color: darkMode ? '#fff' : '#000' }} /><Legend /><Line type="monotone" dataKey="basica" name="Básica" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} /><Line type="monotone" dataKey="natal" name="Natal" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} /></LineChart></ResponsiveContainer>)}</div>
                </div>
            )}
            {config.showRecents && (
                <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border overflow-hidden`}>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Últimas Vendas</h3>
                  <div className="overflow-y-auto max-h-[300px] space-y-3">
                    {recentSales.map(sale => (
                      <div key={sale.id} className={`p-3 rounded-lg flex items-center justify-between ${sale.type === ProductType.BASICA ? (darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50') : (darkMode ? 'bg-red-900/20' : 'bg-red-50')}`}>
                        <div>
                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{sale.client}</div>
                          <div className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {sale.date ? (<><Calendar size={12} />{new Date(sale.date).toLocaleDateString('pt-BR')}</>) : (<><AlertTriangle size={12} className="text-orange-500"/><span className="text-orange-500 font-semibold">Pendente de faturamento</span></>)}
                          </div>
                        </div>
                        <div className={`text-right font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{hideValues ? '••••••' : `+ ${formatCurrency(sale.commissionValueTotal, false)}`}</div>
                      </div>
                    ))}
                    {recentSales.length === 0 && (<div className={`py-8 text-center ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Nenhuma venda recente</div>)}
                  </div>
                </div>
            )}
          </div>
      )}
      {showConfig && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-6 w-full max-w-sm shadow-2xl`}><div className="flex justify-between items-center mb-6"><h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Personalizar Dashboard</h3><button onClick={() => setShowConfig(false)}><X className="text-gray-500 hover:text-gray-700"/></button></div><div className="space-y-4"><label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5"><span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Mostrar Cartões de Resumo</span><input type="checkbox" checked={config.showStats} onChange={e => onUpdateConfig({...config, showStats: e.target.checked})} className="w-5 h-5 rounded text-emerald-600"/></label><label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5"><span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Mostrar Gráficos</span><input type="checkbox" checked={config.showCharts} onChange={e => onUpdateConfig({...config, showCharts: e.target.checked})} className="w-5 h-5 rounded text-emerald-600"/></label><label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5"><span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Mostrar Lista Recente</span><input type="checkbox" checked={config.showRecents} onChange={e => onUpdateConfig({...config, showRecents: e.target.checked})} className="w-5 h-5 rounded text-emerald-600"/></label></div><button onClick={() => setShowConfig(false)} className="w-full mt-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">Concluir</button></div></div>)}
    </div>
  );
};
export default FullDashboard;