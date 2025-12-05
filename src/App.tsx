import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SalesList from './components/SalesList';
import SalesForm from './components/SalesForm';
import ClientReports from './components/ClientReports';
import SettingsHub from './components/SettingsHub';
import FinanceDashboard from './components/FinanceDashboard';
import FinanceManager from './components/FinanceManager';
import FinanceGoals from './components/FinanceGoals';
import FinanceChallenges from './components/FinanceChallenges';
import FinanceCategories from './components/FinanceCategories';
import FinanceReceivables from './components/FinanceReceivables';
import FinanceDistribution from './components/FinanceDistribution';
import FinanceTransactionsList from './components/FinanceTransactionsList';
import BoletoControl from './components/BoletoControl';
import About from './components/About';
import ImportModal from './components/ImportModal';
import BackupModal from './components/BackupModal';
import BulkDateModal from './components/BulkDateModal';
import FinanceTransactionForm from './components/FinanceTransactionForm';
import Login from './components/Login';
import AdminUsers from './components/AdminUsers';
import UserProfile from './components/UserProfile';
import ToastContainer, { ToastMessage } from './components/Toast';
import { Sale, ProductType, SaleFormData, CommissionRule, AppMode, FinanceAccount, Transaction, CreditCard, TransactionCategory, ImportMapping, ReportConfig, FinanceGoal, Challenge, ChallengeCell, TransactionType, Receivable, AppPreferences, DashboardWidgetConfig, User } from './types';
import * as Logic from './services/logic';
import { getSession, clearSession } from './auth/session';
import PendingSales from './components/PendingSales';

// Ensure we are importing from the correct auth module
// If you are using the new Firestore auth, Login component handles the logic internally
// and calls onLoginSuccess.

export default function App() {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // New dedicated loading state for auth

  const [appMode, setAppMode] = useState<AppMode>('SALES');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<string>('commissions');
  
  const [darkMode, setDarkMode] = useState(true);
  
  // SALES Data State
  const [sales, setSales] = useState<Sale[]>([]);
  const [rulesBasic, setRulesBasic] = useState<CommissionRule[]>([]);
  const [rulesNatal, setRulesNatal] = useState<CommissionRule[]>([]);
  const [reportConfig, setReportConfig] = useState<ReportConfig>(Logic.DEFAULT_REPORT_CONFIG);
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(Logic.DEFAULT_APP_PREFERENCES);
  
  // FINANCE Data State
  const [finAccounts, setFinAccounts] = useState<FinanceAccount[]>([]);
  const [finCards, setFinCards] = useState<CreditCard[]>([]);
  const [finTransactions, setFinTransactions] = useState<Transaction[]>([]);
  const [finCategories, setFinCategories] = useState<TransactionCategory[]>([]);
  const [finGoals, setFinGoals] = useState<FinanceGoal[]>([]);
  const [finChallenges, setFinChallenges] = useState<Challenge[]>([]);
  const [finCells, setFinCells] = useState<ChallengeCell[]>([]);
  const [finReceivables, setFinReceivables] = useState<Receivable[]>([]); 

  const [loadingData, setLoadingData] = useState(false); // Loading for data, distinct from auth
  const [hasUndo, setHasUndo] = useState(false); 
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawData, setImportRawData] = useState<any[][]>([]);
  const [backupModal, setBackupModal] = useState<{ isOpen: boolean, mode: 'BACKUP'|'RESTORE'|'CLEAR' }>({ isOpen: false, mode: 'BACKUP' });
  const [isBulkDateOpen, setIsBulkDateOpen] = useState(false);
  
  // Finance Modal State
  const [isFinanceFormOpen, setIsFinanceFormOpen] = useState(false);
  const [financeFormType, setFinanceFormType] = useState<TransactionType>('EXPENSE');

  // **NOVA LÓGICA: ATUALIZA O TÍTULO DA PÁGINA**
  useEffect(() => {
    if (currentUser) {
        if (appMode === 'SALES') {
            document.title = 'Gestor360 - Vendas';
        } else {
            document.title = 'Gestor360 - Finanças';
        }
    } else {
        document.title = 'Gestor360 - Login';
    }
  }, [appMode, currentUser]);

  // Notifications
  const addToast = (type: 'SUCCESS' | 'ERROR' | 'INFO', message: any) => {
      const id = crypto.randomUUID();
      const msgStr = typeof message === 'string' ? message : (message?.message || String(message));
      setToasts(prev => [...prev, { id, type, message: msgStr }]);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- INITIALIZATION ---
  useEffect(() => {
      const initAuth = () => {
        try {
            const sessionUser = getSession();
            if (sessionUser) {
                console.log("Session found for user:", sessionUser.username);
                handleLoginSuccess(sessionUser);
            } else {
                console.log("No session found, showing login.");
            }
        } catch (e) {
            console.error("Auth initialization error:", e);
        } finally {
            setAuthLoading(false);
        }
      };
      
      initAuth();
  }, []);

  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
      Logic.setLogicUser(user.id); // IMPORTANT: Set user ID for isolated storage
      loadDataForUser();
  };

  const handleLogout = () => {
      clearSession();
      setCurrentUser(null);
      setSales([]);
      setFinAccounts([]);
      // Force reload to clear memory
      window.location.reload();
  };

  const loadDataForUser = () => {
    setLoadingData(true);
    try {
        const loadedSales = Logic.getStoredSales();
        const loadedBasic = Logic.getStoredTable(ProductType.BASICA);
        const loadedNatal = Logic.getStoredTable(ProductType.NATAL);
        const loadedReportConfig = Logic.getReportConfig();
        const theme = Logic.getTheme();
        const prefs = Logic.getAppPreferences();

        setSales(loadedSales);
        setRulesBasic(loadedBasic);
        setRulesNatal(loadedNatal);
        setReportConfig(loadedReportConfig);
        setAppPreferences(prefs);
        setDarkMode(theme !== 'light');
        setHasUndo(Logic.hasSnapshot());

        if (Logic.checkBackupReminder()) {
            addToast('INFO', "Lembrete: Faça um backup dos seus dados em Configurações.");
        }

        const finData = Logic.getFinanceData();
        if (finData.accounts.length === 0) {
            finData.accounts.push({ id: crypto.randomUUID(), name: 'Conta Principal', type: 'CHECKING', balance: 0, color: 'blue', isAccounting: true });
        }
        setFinAccounts(finData.accounts);
        setFinCards(finData.cards);
        setFinTransactions(finData.transactions);
        setFinCategories(finData.categories);
        setFinGoals(finData.goals);
        setFinChallenges(finData.challenges);
        setFinCells(finData.cells);
        setFinReceivables(finData.receivables);
    } catch(e) {
        console.error("Error loading user data", e);
        addToast('ERROR', 'Erro ao carregar dados do usuário.');
    } finally {
        setLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
        Logic.saveTheme(darkMode ? 'dark' : 'light');
    }
  }, [darkMode, currentUser]);

  // Preference Handlers
  const handleToggleHideValues = () => {
      const newPrefs = { ...appPreferences, hideValues: !appPreferences.hideValues };
      setAppPreferences(newPrefs);
      Logic.saveAppPreferences(newPrefs);
  };

  const handleUpdateDashboardConfig = (isFinance: boolean, config: DashboardWidgetConfig) => {
      const newPrefs = { ...appPreferences };
      if (isFinance) newPrefs.financeConfig = config;
      else newPrefs.salesConfig = config;
      
      setAppPreferences(newPrefs);
      Logic.saveAppPreferences(newPrefs);
  };

  // CRUD Operations - SALES
  const handleSaveSale = (formData: SaleFormData) => {
    const activeRules = formData.type === ProductType.BASICA ? rulesBasic : rulesNatal;
    let newSalesList: Sale[];

    Logic.takeSnapshot(sales);
    setHasUndo(true);

    if (editingSale) {
      const computed = Logic.computeSaleMetrics(formData, activeRules);
      const updatedSale: Sale = { ...computed, id: editingSale.id };
      newSalesList = sales.map(s => s.id === updatedSale.id ? updatedSale : s);
    } else {
      const newSale = Logic.computeSaleMetrics(formData, activeRules);
      newSalesList = [...sales, newSale];
    }

    setSales(newSalesList);
    Logic.saveSales(newSalesList);
    setIsFormOpen(false);
    setEditingSale(undefined);
    addToast('SUCCESS', editingSale ? 'Venda atualizada!' : 'Venda registrada com sucesso!');
  };

  const handleDeleteSale = (sale: Sale) => {
      Logic.takeSnapshot(sales);
      setHasUndo(true);
      const newSales = sales.filter(s => s.id !== sale.id);
      setSales(newSales);
      Logic.saveSales(newSales);
      addToast('INFO', 'Venda excluída. Você pode desfazer se necessário.');
  };

  const handleUpdateRules = (type: ProductType, newRules: CommissionRule[]) => {
    Logic.takeSnapshot(sales);
    setHasUndo(true);
    if (type === ProductType.BASICA) {
      setRulesBasic(newRules);
      Logic.saveTable(type, newRules);
      const updatedSales = sales.map(s => s.type === ProductType.BASICA ? Logic.recomputeSale(s, newRules) : s);
      setSales(updatedSales);
      Logic.saveSales(updatedSales);
    } else {
      setRulesNatal(newRules);
      Logic.saveTable(type, newRules);
      const updatedSales = sales.map(s => s.type === ProductType.NATAL ? Logic.recomputeSale(s, newRules) : s);
      setSales(updatedSales);
      Logic.saveSales(updatedSales);
    }
    addToast('SUCCESS', 'Tabela de comissão atualizada!');
  };

  const handleUpdateReportConfig = (newConfig: ReportConfig) => {
      setReportConfig(newConfig);
      Logic.saveReportConfig(newConfig);
      addToast('SUCCESS', 'Configurações salvas.');
  };

  const handleExportTemplate = () => Logic.generateCSVTemplate();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const file = e.target.files[0];
        const rows = await Logic.readExcelFile(file);
        if (rows.length < 2) {
            addToast('ERROR', "O arquivo parece estar vazio ou sem dados.");
            return;
        }
        setImportRawData(rows);
        setIsImportModalOpen(true);
        e.target.value = ''; 
      } catch (error) {
        console.error(error);
        addToast('ERROR', 'Erro ao ler o arquivo.');
      }
    }
  };

  const handleConfirmImport = (mapping: ImportMapping) => {
    try {
        Logic.takeSnapshot(sales); 
        setHasUndo(true);

        const importedSales = Logic.processImportWithMapping(importRawData, mapping, rulesBasic, rulesNatal);
        const newSalesList = [...sales, ...importedSales];
        setSales(newSalesList);
        Logic.saveSales(newSalesList);
        addToast('SUCCESS', `${importedSales.length} vendas importadas com sucesso!`);
        setIsImportModalOpen(false);
        setImportRawData([]);
    } catch (e) {
        addToast('ERROR', "Erro ao processar os dados.");
    }
  };

  const handleClearRequest = () => {
     setBackupModal({ isOpen: true, mode: 'CLEAR' });
  };
  
  const handleRestoreRequest = () => {
     setBackupModal({ isOpen: true, mode: 'RESTORE' });
  };

  const handleRestoreSuccess = () => {
      setBackupModal({ ...backupModal, isOpen: false });
      addToast('SUCCESS', 'Backup restaurado com sucesso! Reiniciando sistema...');
      setTimeout(() => {
          window.location.reload();
      }, 2500);
  };

  const handleAdvancedBulkUpdate = (targetDate: string, filterType: ProductType | 'ALL', launchDateFrom: string, onlyEmpty: boolean) => {
      Logic.takeSnapshot(sales); 
      setHasUndo(true);

      let updatedCount = 0;
      const updatedSales = sales.map(s => {
          if (filterType !== 'ALL' && s.type !== filterType) return s;
          const sLaunchDateStr = s.completionDate ? s.completionDate.split('T')[0] : (s.date ? s.date.split('T')[0] : '');
          if (!sLaunchDateStr || sLaunchDateStr < launchDateFrom) return s;
          if (onlyEmpty && (s.date && s.date.length > 8)) return s;

          updatedCount++;
          return { ...s, date: targetDate };
      });

      if (updatedCount > 0) {
          setSales(updatedSales);
          Logic.saveSales(updatedSales);
          setIsBulkDateOpen(false); 
          setTimeout(() => { addToast('SUCCESS', `${updatedCount} vendas atualizadas!`); }, 200);
      } else {
          addToast('INFO', "Nenhuma venda correspondente encontrada.");
      }
  };

  const handleUndo = () => {
      if (confirm("Deseja desfazer a última operação em massa?")) {
          const restored = Logic.restoreSnapshot();
          if (restored) {
              setSales(restored);
              Logic.saveSales(restored);
              Logic.clearSnapshot();
              setHasUndo(false);
              addToast('SUCCESS', "Ação desfeita com sucesso.");
          } else {
              addToast('ERROR', "Não foi possível restaurar.");
          }
      }
  };

  const handleUpdateFinance = (acc: FinanceAccount[], trans: Transaction[], cards: CreditCard[]) => {
    setFinAccounts(acc);
    setFinTransactions(trans);
    setFinCards(cards);
    Logic.saveFinanceData(acc, cards, trans, finCategories, finGoals, finChallenges, finCells, finReceivables);
  };
  
  const handleUpdateCategories = (cats: TransactionCategory[]) => {
      setFinCategories(cats);
      Logic.saveFinanceData(finAccounts, finCards, finTransactions, cats, finGoals, finChallenges, finCells, finReceivables);
  };

  const handleUpdateGoals = (goals: FinanceGoal[]) => {
      setFinGoals(goals);
      Logic.saveFinanceData(finAccounts, finCards, finTransactions, finCategories, goals, finChallenges, finCells, finReceivables);
  };

  const handleUpdateChallenges = (challenges: Challenge[], cells: ChallengeCell[]) => {
      setFinChallenges(challenges);
      setFinCells(cells);
      Logic.saveFinanceData(finAccounts, finCards, finTransactions, finCategories, finGoals, challenges, cells, finReceivables);
  };

  const handleUpdateReceivables = (newRecs: Receivable[]) => {
      setFinReceivables(newRecs);
      Logic.saveFinanceData(finAccounts, finCards, finTransactions, finCategories, finGoals, finChallenges, finCells, newRecs);
  };

  const handleSaveTransaction = (data: Transaction | Transaction[]) => {
      const incomingTransactions = Array.isArray(data) ? data : [data];
      const newTransactions = [...incomingTransactions, ...finTransactions];
      let newAccounts = [...finAccounts];
      incomingTransactions.forEach(transaction => {
          if (transaction.isPaid) {
              newAccounts = newAccounts.map(acc => {
                  if (acc.id === transaction.accountId) {
                      const val = transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
                      return { ...acc, balance: acc.balance + val };
                  }
                  if (transaction.type === 'TRANSFER' && acc.id === transaction.targetAccountId) {
                      return { ...acc, balance: acc.balance + transaction.amount };
                  }
                  return acc;
              });
          }
      });
      handleUpdateFinance(newAccounts, newTransactions, finCards);
      setIsFinanceFormOpen(false);
      addToast('SUCCESS', incomingTransactions.length > 1 ? 'Transações registradas!' : 'Lançamento registrado!');
  };

  const handleConfirmTransaction = (transaction: Transaction) => {
      const updatedTransactions = finTransactions.map(t => 
          t.id === transaction.id ? { ...t, isPaid: true } : t
      );
      const newAccounts = finAccounts.map(acc => {
          if (acc.id === transaction.accountId) {
              const val = transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
              return { ...acc, balance: acc.balance + val };
          }
          if (transaction.type === 'TRANSFER' && acc.id === transaction.targetAccountId) {
              return { ...acc, balance: acc.balance + transaction.amount };
          }
          return acc;
      });
      handleUpdateFinance(newAccounts, updatedTransactions, finCards);
      addToast('SUCCESS', 'Transação efetivada com sucesso!');
  };

  const handlePayInvoice = (cardId: string, accountId: string, amount: number, date: string) => {
      const paymentTrans: Transaction = {
          id: crypto.randomUUID(),
          description: 'Pagamento Fatura Cartão',
          amount: amount,
          type: 'EXPENSE',
          date: date,
          categoryId: 'CARD_PAYMENT',
          personType: 'PF',
          accountId: accountId,
          isPaid: true
      };
      const updatedTransactions = finTransactions.map(t => {
          if (t.cardId === cardId && !t.isPaid && t.type === 'EXPENSE') {
              return { ...t, isPaid: true };
          }
          return t;
      });
      const updatedAccounts = finAccounts.map(acc => {
          if (acc.id === accountId) {
              return { ...acc, balance: acc.balance - amount };
          }
          return acc;
      });
      const finalTransactions = [paymentTrans, ...updatedTransactions];
      setFinTransactions(finalTransactions);
      setFinAccounts(updatedAccounts);
      Logic.saveFinanceData(updatedAccounts, finCards, finalTransactions, finCategories, finGoals, finChallenges, finCells, finReceivables);
      addToast('SUCCESS', 'Fatura paga e limite liberado!');
  };

  const handleDistribute = (receivableId: string, distributions: { accountId: string, value: number }[]) => {
      const updatedReceivables = finReceivables.map(r => r.id === receivableId ? { ...r, distributed: true } : r);
      setFinReceivables(updatedReceivables);
      const newTrans: Transaction[] = [];
      let newAccounts = [...finAccounts];
      distributions.forEach(dist => {
          newTrans.push({
              id: crypto.randomUUID(),
              description: `Distribuição de Recebível`,
              amount: dist.value,
              type: 'INCOME',
              date: new Date().toISOString().split('T')[0],
              categoryId: 'DISTRIBUTION',
              personType: 'PF',
              accountId: dist.accountId,
              isPaid: true
          });
          newAccounts = newAccounts.map(acc => {
              if (acc.id === dist.accountId) {
                  return { ...acc, balance: acc.balance + dist.value };
              }
              return acc;
          });
      });
      setFinTransactions([...newTrans, ...finTransactions]); 
      setFinAccounts(newAccounts);
      Logic.saveFinanceData(newAccounts, finCards, [...newTrans, ...finTransactions], finCategories, finGoals, finChallenges, finCells, updatedReceivables);
      addToast('SUCCESS', 'Distribuição realizada com sucesso!');
  };

  const handleDeleteTransaction = (id: string) => {
      if(confirm('Excluir transação? (O saldo das contas não será revertido automaticamente)')) {
          const newTrans = finTransactions.filter(t => t.id !== id);
          handleUpdateFinance(finAccounts, newTrans, finCards);
          addToast('INFO', 'Transação excluída.');
      }
  };

  // --- RENDER ---
  
  if (authLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-emerald-500">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
             <p>Verificando sessão...</p>
          </div>
      );
  }

  // If not logged in, show Login
  if (!currentUser) {
      return (
          <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <Login onLoginSuccess={handleLoginSuccess} />
          </>
      );
  }

  if (loadingData) {
       return (
          <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-emerald-500">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
             <p>Carregando dados...</p>
          </div>
      );
  }

  return (
    <Layout 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setSettingsSubTab(''); }} 
        appMode={appMode} 
        setAppMode={setAppMode}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNewSale={() => { setEditingSale(undefined); setIsFormOpen(true); }}
        onNewIncome={() => { setFinanceFormType('INCOME'); setIsFinanceFormOpen(true); }}
        onNewExpense={() => { setFinanceFormType('EXPENSE'); setIsFinanceFormOpen(true); }}
        onNewTransfer={() => { setFinanceFormType('TRANSFER'); setIsFinanceFormOpen(true); }}
    >
      <div className="max-w-7xl mx-auto pb-24"> 
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {appMode === 'SALES' && (
            <>
                {activeTab === 'dashboard' && (
                    <Dashboard 
                        sales={sales} 
                        onNewSale={() => { setEditingSale(undefined); setIsFormOpen(true); }}
                        darkMode={darkMode}
                        hideValues={appPreferences.hideValues}
                        config={appPreferences.salesConfig}
                        onToggleHide={handleToggleHideValues}
                        onUpdateConfig={(cfg) => handleUpdateDashboardConfig(false, cfg)}
                    />
                )}
                {activeTab === 'sales' && (
                    <SalesList 
                        sales={sales} 
                        onEdit={(sale) => { setEditingSale(sale); setIsFormOpen(true); }}
                        onDelete={handleDeleteSale}
                        onNew={() => { setEditingSale(undefined); setIsFormOpen(true); }}
                        onExportTemplate={handleExportTemplate}
                        onImportFile={handleImportFile}
                        onClearAll={handleClearRequest}
                        onRestore={handleRestoreRequest}
                        onOpenBulkAdvanced={() => setIsBulkDateOpen(true)}
                        onUndo={handleUndo}
                        onBillSale={handleBillSale}
                        onBillBulk={handleBillBulk}
                        onDeleteBulk={handleDeleteBulk}
                        hasUndo={hasUndo}
                        onNotify={addToast}
                    />
                )}
                {activeTab === 'pending_sales' && (
                    <PendingSales 
                        sales={sales} 
                        onBatchUpdate={(ids, newDate) => handleBillBulk(ids, newDate)}
                        darkMode={darkMode}
                    />
                )}
                {activeTab === 'reports' && (
                    <ClientReports 
                        sales={sales} 
                        config={reportConfig}
                        onOpenSettings={() => {
                            setSettingsSubTab('reports');
                            setActiveTab('settings');
                        }}
                    />
                )}
                {activeTab === 'boletos' && (
                    <BoletoControl 
                      sales={sales} 
                      onUpdateSale={handleSaveSale} 
                    />
                )}
                {activeTab === 'settings' && (
                    <SettingsHub 
                        rulesBasic={rulesBasic}
                        rulesNatal={rulesNatal}
                        reportConfig={reportConfig}
                        onSaveRules={handleUpdateRules}
                        onSaveReportConfig={handleUpdateReportConfig}
                        darkMode={darkMode}
                        defaultTab={settingsSubTab}
                    />
                )}
                {activeTab === 'admin_users' && currentUser.role === 'ADMIN' && <AdminUsers currentUser={currentUser} />}
                {activeTab === 'profile' && <UserProfile user={currentUser} onUpdate={(u) => { setCurrentUser(u); addToast('SUCCESS', 'Perfil atualizado'); }} />}
                {activeTab === 'about' && <About />}
            </>
        )}
        
        {appMode === 'FINANCE' && (
            <>
                {activeTab === 'fin_dashboard' && (
                    <FinanceDashboard 
                        accounts={finAccounts} 
                        transactions={finTransactions} 
                        cards={finCards} 
                        receivables={finReceivables}
                        darkMode={darkMode}
                        hideValues={appPreferences.hideValues}
                        config={appPreferences.financeConfig}
                        onToggleHide={handleToggleHideValues}
                        onUpdateConfig={(cfg) => handleUpdateDashboardConfig(true, cfg)}
                        onNavigate={setActiveTab}
                    />
                )}
                {activeTab === 'fin_receivables' && (
                    <FinanceReceivables 
                        receivables={finReceivables}
                        onUpdate={handleUpdateReceivables}
                        sales={sales}
                        accounts={finAccounts}
                        darkMode={darkMode}
                    />
                )}
                {activeTab === 'fin_distribution' && (
                    <FinanceDistribution 
                        receivables={finReceivables}
                        accounts={finAccounts}
                        onDistribute={handleDistribute}
                        darkMode={darkMode}
                    />
                )}
                {activeTab === 'fin_transactions' && (
                    <FinanceTransactionsList 
                        transactions={finTransactions}
                        accounts={finAccounts}
                        categories={finCategories}
                        onDelete={handleDeleteTransaction}
                        onPay={handleConfirmTransaction}
                        darkMode={darkMode}
                    />
                )}
                {activeTab === 'fin_manager' && (
                    <FinanceManager 
                        accounts={finAccounts} 
                        cards={finCards} 
                        transactions={finTransactions}
                        onUpdate={handleUpdateFinance}
                        onPayInvoice={handlePayInvoice}
                        darkMode={darkMode}
                        onNotify={addToast}
                    />
                )}
                {activeTab === 'fin_categories' && (
                    <FinanceCategories
                        categories={finCategories}
                        onUpdate={handleUpdateCategories}
                        darkMode={darkMode}
                    />
                )}
                {activeTab === 'fin_goals' && (
                    <FinanceGoals
                        goals={finGoals}
                        onUpdate={handleUpdateGoals}
                        darkMode={darkMode}
                    />
                )}
                {activeTab === 'fin_challenges' && (
                    <FinanceChallenges
                        challenges={finChallenges}
                        cells={finCells}
                        onUpdate={handleUpdateChallenges}
                        darkMode={darkMode}
                    />
                )}
                {activeTab === 'admin_users' && currentUser.role === 'ADMIN' && <AdminUsers currentUser={currentUser} />}
                {activeTab === 'profile' && <UserProfile user={currentUser} onUpdate={(u) => { setCurrentUser(u); addToast('SUCCESS', 'Perfil atualizado'); }} />}
                {activeTab === 'about' && <About />}
            </>
        )}

      </div>

      {isFormOpen && (
        <SalesForm 
          initialData={editingSale} 
          onSubmit={handleSaveSale} 
          onCancel={() => { setIsFormOpen(false); setEditingSale(undefined); }}
          rulesBasic={rulesBasic}
          rulesNatal={rulesNatal}
        />
      )}

      {isFinanceFormOpen && (
          <FinanceTransactionForm
             initialType={financeFormType}
             accounts={finAccounts}
             categories={finCategories}
             onSave={handleSaveTransaction}
             onCancel={() => setIsFinanceFormOpen(false)}
             darkMode={darkMode}
          />
      )}

      {isImportModalOpen && (
        <ImportModal 
            isOpen={isImportModalOpen}
            onClose={() => { setIsImportModalOpen(false); setImportRawData([]); }}
            fileData={importRawData}
            onConfirm={handleConfirmImport}
            darkMode={darkMode}
        />
      )}
      
      <BackupModal 
        isOpen={backupModal.isOpen}
        mode={backupModal.mode}
        onClose={() => setBackupModal({ ...backupModal, isOpen: false })}
        onSuccess={() => addToast('SUCCESS', 'Backup gerado com sucesso!')} 
        onRestoreSuccess={handleRestoreSuccess}
      />

      <BulkDateModal 
        isOpen={isBulkDateOpen}
        onClose={() => setIsBulkDateOpen(false)}
        onConfirm={handleAdvancedBulkUpdate}
        darkMode={darkMode}
      />

    </Layout>
  );
}