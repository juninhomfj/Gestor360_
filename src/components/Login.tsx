import React, { useState } from 'react';
import { User } from '../types';
import { loginUser } from '../auth/userStorage';
import { Lock, User as UserIcon, LogIn, AlertCircle, HelpCircle, X, CheckCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
        setError('Preencha todos os campos.');
        return;
    }

    setLoading(true);
    try {
        // Use the Firestore-based login
        const user = await loginUser(username, password);
        if (user) {
            onLoginSuccess(user);
        } else {
            setError('Usuário ou senha incorretos.');
        }
    } catch (e: any) {
        console.error("Login failed", e);
        setError('Erro ao conectar. Tente novamente.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Vendas360</h1>
                <p className="text-emerald-100">Acesso Seguro</p>
            </div>
            
            {!showForgot ? (
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Usuário (E-mail)</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input 
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="Seu e-mail de acesso"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input 
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="Sua senha secreta"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin"/> : <LogIn size={20} />}
                        {loading ? 'Verificando...' : 'Entrar no Sistema'}
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="w-full text-center text-sm text-gray-500 hover:text-emerald-600 hover:underline mt-4 transition-colors"
                    >
                        Esqueci minha senha
                    </button>
                </form>
            ) : (
                <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <HelpCircle className="text-blue-500"/> Recuperar Acesso
                        </h3>
                        <button onClick={() => setShowForgot(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        A recuperação de senha é gerenciada pelo <strong>Administrador</strong>.
                    </p>
                    
                    <p className="text-sm text-gray-600">
                        Entre em contato com o suporte para solicitar um reset de senha.
                    </p>

                    <button 
                        onClick={() => setShowForgot(false)}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-bold"
                    >
                        Voltar para Login
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default Login;