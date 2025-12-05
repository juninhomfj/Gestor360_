

import React, { useState } from 'react';
import { FinanceAccount, CreditCard, Transaction } from '../types';
import { CreditCard as CardIcon, Wallet, Plus, Trash2, Edit2, CheckCircle, X, Shield, EyeOff } from 'lucide-react';

interface FinanceManagerProps {
  accounts: FinanceAccount[];
  cards: CreditCard[];
  transactions: Transaction[]; // Added to calc invoice
  onUpdate: (acc: FinanceAccount[], trans: Transaction[], cards: CreditCard[]) => void;
  onPayInvoice: (cardId: string, accountId: string, amount: number, date: string) => void;
  darkMode?: boolean;
  onNotify?: (type: 'SUCCESS' | 'ERROR', msg: string) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ 
    accounts = [], cards = [], transactions = [], onUpdate, onPayInvoice, darkMode, onNotify 
}) => {
  // Account Form
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<FinanceAccount['type']>('CHECKING');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccIsAccounting, setNewAccIsAccounting] = useState(true); // Default to Accounting

  // Card Form
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');

  // Invoice Payment Modal
  const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean, cardId: string, amount: number } | null>(null);
  const [payAccount, setPayAccount] = useState(accounts[0]?.id || '');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // --- LOGIC ---

  const handleAddAccount = () => {
      if (!newAccName) return;
      const newAcc: FinanceAccount = {
          id: crypto.randomUUID(),
          name: newAccName,
          type: newAccType,
          balance: parseFloat(newAccBalance) || 0,
          color: 'blue',
          isAccounting: newAccIsAccounting
      };
      onUpdate([...accounts, newAcc], transactions, cards);
      setIsAccountFormOpen(false);
      setNewAccName('');
      setNewAccBalance('');
      setNewAccIsAccounting(true);
      if(onNotify) onNotify('SUCCESS', 'Conta adicionada!');
  };

  const handleDeleteAccount = (id: string) => {
      if(confirm('Tem certeza? Isso pode afetar o histórico de transações.')) {
          onUpdate(accounts.filter(a => a.id !== id), transactions, cards);
      }
  };

  const handleAddCard = () => {
      if (!newCardName) return;
      const newCard: CreditCard = {
          id: crypto.randomUUID(),
          name: newCardName,
          limit: parseFloat(newCardLimit) || 0,
          currentInvoice: 0,
          closingDay: 10,
          dueDay: 15,
          color: 'purple'
      };
      onUpdate(accounts, transactions, [...cards, newCard]);
      setIsCardFormOpen(false);
      setNewCardName('');
      setNewCardLimit('');
      if(onNotify) onNotify('SUCCESS', 'Cartão adicionado!');
  };

  const handleDeleteCard = (id: string) => {
      if(confirm('Excluir cartão?')) {
          onUpdate(accounts, transactions, cards.filter(c => c.id !== id));
      }
  };

  const calculateInvoice = (cardId: string) => {
      return transactions
        .filter(t => t.cardId === cardId && !t.isPaid && t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amount, 0);
  };

  const handleConfirmPayment = () => {
      if (invoiceModal && payAccount) {
          onPayInvoice(invoiceModal.cardId, payAccount, invoiceModal.amount, payDate);
          setInvoiceModal(null);
      }
  };

  // --- STYLES ---
  const textClass = darkMode ? 'text-slate-200' : 'text-gray-900';
  const containerClass = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm';
  const inputClass = darkMode ? 'bg-black border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className={`text-3xl font-bold ${textClass} mb-2`}>Contas & Cartões</h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Gerencie onde seu dinheiro está guardado.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ACCOUNTS SECTION */}
          <div className={`${containerClass} rounded-xl border p-6`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`font-bold text-xl flex items-center gap-2 ${textClass}`}>
                        <Wallet className="text-blue-500" /> Contas Bancárias
                    </h3>
                    <button 
                        onClick={() => setIsAccountFormOpen(true)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="space-y-3">
                    {accounts.map(acc => (
                        <div key={acc.id} className={`p-4 rounded-lg border flex justify-between items-center ${darkMode ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
                            <div>
                                <span className={`font-bold block ${textClass} flex items-center gap-2`}>
                                    {acc.name} 
                                    {!acc.isAccounting && <EyeOff size={14} className="text-gray-500" title="Não Contábil" />}
                                </span>
                                <span className="text-xs text-gray-500 uppercase">{acc.type}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`font-mono font-bold ${acc.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    R$ {acc.balance.toFixed(2)}
                                </span>
                                <button onClick={() => handleDeleteAccount(acc.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {isAccountFormOpen && (
                    <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-blue-50'}`}>
                        <h4 className="text-sm font-bold mb-3">Nova Conta</h4>
                        <div className="space-y-3">
                            <input 
                                placeholder="Nome da Conta" 
                                className={`w-full p-2 rounded border ${inputClass}`}
                                value={newAccName} onChange={e => setNewAccName(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <select 
                                    className={`flex-1 p-2 rounded border ${inputClass}`}
                                    value={newAccType} onChange={e => setNewAccType(e.target.value as any)}
                                >
                                    <option value="CHECKING">Corrente</option>
                                    <option value="SAVINGS">Poupança</option>
                                    <option value="INVESTMENT">Investimento</option>
                                    <option value="CASH">Dinheiro</option>
                                    <option value="INTERNAL">Interna (Cofre)</option>
                                </select>
                                <input 
                                    type="number" placeholder="Saldo Inicial" 
                                    className={`flex-1 p-2 rounded border ${inputClass}`}
                                    value={newAccBalance} onChange={e => setNewAccBalance(e.target.value)}
                                />
                            </div>
                            
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5">
                                <input 
                                    type="checkbox" 
                                    checked={newAccIsAccounting}
                                    onChange={e => setNewAccIsAccounting(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <div className="text-sm">
                                    <span className={`block font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Conta Contábil?</span>
                                    <span className="text-xs text-gray-500">Desmarque para "Cartão Premiação" ou controles internos que não somam no patrimônio oficial.</span>
                                </div>
                            </label>

                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setIsAccountFormOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3">Cancelar</button>
                                <button onClick={handleAddAccount} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Salvar</button>
                            </div>
                        </div>
                    </div>
                )}
          </div>

          {/* CARDS SECTION */}
          <div className={`${containerClass} rounded-xl border p-6`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`font-bold text-xl flex items-center gap-2 ${textClass}`}>
                        <CardIcon className="text-purple-500" /> Cartões de Crédito
                    </h3>
                    <button 
                        onClick={() => setIsCardFormOpen(true)}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {(cards || []).map(card => {
                        const invoice = calculateInvoice(card.id);
                        const available = card.limit - invoice;
                        const percent = Math.min((invoice / card.limit) * 100, 100);

                        return (
                            <div key={card.id} className={`p-4 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`font-bold block ${textClass}`}>{card.name}</span>
                                        <span className="text-xs text-gray-500">Limite Total: R$ {card.limit.toFixed(2)}</span>
                                    </div>
                                    <button onClick={() => handleDeleteCard(card.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-gray-500">Fatura Atual</span>
                                        <span className="text-purple-600 font-bold">R$ {invoice.toFixed(2)}</span>
                                    </div>
                                    <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-gray-200'}`}>
                                        <div className="h-full bg-purple-500" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Disponível: R$ {available.toFixed(2)}</span>
                                        <span>{percent.toFixed(0)}% uso</span>
                                    </div>
                                </div>

                                {invoice > 0 && (
                                    <button 
                                        onClick={() => setInvoiceModal({ isOpen: true, cardId: card.id, amount: invoice })}
                                        className="w-full mt-3 py-2 bg-purple-600/10 text-purple-600 hover:bg-purple-600 hover:text-white rounded text-sm font-bold transition-all border border-purple-200 dark:border-purple-900"
                                    >
                                        Pagar Fatura
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {(cards || []).length === 0 && <p className="text-gray-500 text-sm italic text-center py-4">Nenhum cartão cadastrado.</p>}
                </div>

                {isCardFormOpen && (
                    <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-purple-100 bg-purple-50'}`}>
                        <h4 className="text-sm font-bold mb-3">Novo Cartão</h4>
                        <div className="space-y-3">
                            <input 
                                placeholder="Nome do Cartão" 
                                className={`w-full p-2 rounded border ${inputClass}`}
                                value={newCardName} onChange={e => setNewCardName(e.target.value)}
                            />
                            <input 
                                type="number" placeholder="Limite Total" 
                                className={`w-full p-2 rounded border ${inputClass}`}
                                value={newCardLimit} onChange={e => setNewCardLimit(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setIsCardFormOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3">Cancelar</button>
                                <button onClick={handleAddCard} className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-bold">Salvar</button>
                            </div>
                        </div>
                    </div>
                )}
          </div>
      </div>

      {/* INVOICE PAYMENT MODAL */}
      {invoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-6 w-full max-w-sm shadow-2xl`}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Pagamento de Fatura</h3>
                      <button onClick={() => setInvoiceModal(null)} className="text-gray-400 hover:text-gray-500"><X size={20}/></button>
                  </div>
                  
                  <div className="mb-6 text-center">
                      <p className="text-gray-500 text-sm mb-1">Valor da Fatura</p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>R$ {invoiceModal.amount.toFixed(2)}</p>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Pagar com a conta:</label>
                          <select 
                            className={`w-full p-2 rounded border ${inputClass}`}
                            value={payAccount}
                            onChange={e => setPayAccount(e.target.value)}
                          >
                              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (R$ {a.balance.toFixed(2)})</option>)}
                          </select>
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Data do Pagamento:</label>
                          <input 
                            type="date"
                            className={`w-full p-2 rounded border ${inputClass}`}
                            value={payDate}
                            onChange={e => setPayDate(e.target.value)}
                          />
                      </div>

                      <button 
                        onClick={handleConfirmPayment}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 mt-2"
                      >
                          <CheckCircle size={20} /> Confirmar Pagamento
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FinanceManager;
