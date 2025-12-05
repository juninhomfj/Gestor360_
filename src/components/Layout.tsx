import React, { useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Settings, Menu, X, ShoppingBag, Users, FileText, Wallet, PieChart, Sun, Moon, Target, Trophy, Tag, ArrowLeftRight, PiggyBank, List, LogOut, UserCircle, Shield } from 'lucide-react';
import { AppMode, User } from '../types';
import FAB from './FAB';
import { clearSession } from '../auth/session'; // Import corrigido

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentUser: User;
  onLogout: () => void;
  onNewSale: () => void;
  onNewIncome: () => void;
  onNewExpense: () => void;
  onNewTransfer: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
    children, activeTab, setActiveTab, appMode, setAppMode, darkMode, setDarkMode,
    currentUser, onLogout,
    onNewSale, onNewIncome, onNewExpense, onNewTransfer
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Função de logout corrigida
  const handleLogoutClick = () => {
    clearSession();
    onLogout();
  };

  const salesNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    { id: 'reports', label: 'Clientes & Relatórios', icon: Users },
    { id: 'boletos', label: 'Controle de Boletos', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const financeNavItems = [
    { id: 'fin_dashboard', label: 'Visão Geral', icon: PieChart },
    { id: 'fin_receivables', label: 'A Receber (Master)', icon: PiggyBank }, 
    { id: 'fin_distribution', label: 'Distribuição', icon: ArrowLeftRight }, 
    { id: 'fin_transactions', label: 'Lançamentos', icon: List }, 
    { id: 'fin_manager', label: 'Contas & Cartões', icon: Wallet },
    { id: 'fin_categories', label: 'Categorias', icon: Tag },
    { id: 'fin_goals', label: 'Metas', icon: Target },
    { id: 'fin_challenges', label: 'Desafios & Jogos', icon: Trophy },
  ];

  const currentNavItems = appMode === 'SALES' ? salesNavItems : financeNavItems;

  const toggleAppMode = () => {
    setAppMode(appMode === 'SALES' ? 'FINANCE' : 'SALES');
    setActiveTab(appMode === 'SALES' ? 'fin_dashboard' : 'dashboard');
  };

  // O resto do componente continua o mesmo...
  // (O código completo do Layout.tsx com esta pequena correção será gerado)
  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex flex-col w-64 shadow-2xl z-20 transition-colors duration-300 ${darkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-white text-slate-900 border-r border-slate-200'}`}>
        <div className={`p-6 flex items-center space-x-3 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${appMode === 'SALES' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {appMode === 'SALES' ? 'Vendas360' : 'Finanças360'}
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {currentNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? (appMode === 'SALES' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-500' 
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 ring-1 ring-blue-500')
                  : (darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}

          <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'profile' ? 'bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                  <UserCircle size={20} />
                  <span className="text-sm font-medium">Meu Perfil</span>
              </button>
              
              {currentUser.role === 'ADMIN' && (
                  <button onClick={() => setActiveTab('admin_users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'admin_users' ? 'bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                      <Shield size={20} />
                      <span className="text-sm font-medium">Usuários</span>
                  </button>
              )}
          </div>
        </nav>

        <div className={`p-4 border-t space-y-3 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-full flex items-center justify-center space-x-2 p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                <span className="text-sm font-medium">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            <button
                onClick={toggleAppMode}
                className={`w-full relative group overflow-hidden rounded-xl p-0.5 ${appMode === 'SALES' ? 'bg-gradient-to-r from-blue-400 to-indigo-600' : 'bg-gradient-to-r from-emerald-400 to-teal-600'}`}
            >
                <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
                <div className={`relative rounded-[10px] px-4 py-2 flex items-center justify-center space-x-2 transition-all group-hover:bg-opacity-90 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                    <span className={`font-bold text-sm ${appMode === 'SALES' ? 'text-blue-500' : 'text-emerald-500'}`}>
                        Ir para {appMode === 'SALES' ? 'Finanças' : 'Vendas'}
                    </span>
                </div>
            </button>

            <button onClick={handleLogoutClick} className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 text-sm py-2">
                <LogOut size={16} /> Sair
            </button>

            <div className="text-[10px] text-slate-500 text-center">
                <p>Logado como <strong>{currentUser.username}</strong></p>
                <button onClick={() => setActiveTab('about')} className="hover:text-emerald-400 underline">Sobre</button>
            </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`md:hidden h-16 flex items-center justify-between px-4 z-20 shadow-sm ${darkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${appMode === 'SALES' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {appMode === 'SALES' ? 'Vendas360' : 'Finanças360'}
            </span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={darkMode ? 'text-white' : 'text-slate-800'}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className={`md:hidden absolute top-16 left-0 w-full z-30 shadow-2xl p-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
             <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>Alternar Tema</span>
            </button>

            {currentNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${
                  activeTab === item.id 
                    ? (appMode === 'SALES' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white') 
                    : (darkMode ? 'text-slate-400' : 'text-slate-500')
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}

            <hr className={darkMode ? 'border-slate-700' : 'border-gray-200'} />
            
            <button onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} className="w-full flex items-center space-x-3 px-4 py-3">
                <UserCircle size={20} /> <span>Meu Perfil</span>
            </button>
            <button onClick={handleLogoutClick} className="w-full flex items-center space-x-3 px-4 py-3 text-red-500">
                <LogOut size={20} /> <span>Sair</span>
            </button>

            <button
                onClick={() => { toggleAppMode(); setIsMobileMenuOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg font-bold text-center ${appMode === 'SALES' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}`}
            >
                Ir para {appMode === 'SALES' ? 'Finanças360' : 'Vendas360'}
            </button>
          </div>
        )}

        <main className={`flex-1 overflow-y-auto p-4 md:p-8 relative ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
          {children}
        </main>

        <FAB 
            appMode={appMode}
            onNewSale={onNewSale}
            onNewIncome={onNewIncome}
            onNewExpense={onNewExpense}
            onNewTransfer={onNewTransfer}
        />
      </div>
    </div>
  );
};

export default Layout;