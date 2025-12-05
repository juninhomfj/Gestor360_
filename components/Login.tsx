import React, { useState } from 'react';
import { User } from '../types';
import { login, listUsers } from '../services/auth';
import { Lock, User as UserIcon, LogIn, AlertCircle, HelpCircle, X, CheckCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUser, setForgotUser] = useState('');
  const [forgotMsg, setForgotMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
        setError('Preencha todos os campos.');
        return;
    }

    const user = login(username, password);
    if (user) {
        onLoginSuccess(user);
    } else {
        setError('Usuário ou senha incorretos.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const users = listUsers();
      const exists = users.find(u => u.username.toLowerCase() === forgotUser.toLowerCase());

      if (exists) {
          setForgotMsg({
              type: 'success',
              text: `Usuário encontrado! Por segurança, solicite a redefinição de senha ao Administrador do sistema.`
          });
      } else {
          setForgotMsg({
              type: 'error',
              text: 'Usuário não encontrado.'
          });
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
                        <label className="block text-sm font-bold text-gray-700 mb-2">Usuário</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input 
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="Seu nome de usuário ou e-mail"
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
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
                    >
                        <LogIn size={20} />
                        Entrar no Sistema
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => { setShowForgot(true); setForgotMsg(null); setForgotUser(''); }}
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

                    <p className="text-sm text-gray-600">
                        Informe seu nome de usuário. Se o cadastro existir, mostraremos as instruções.
                    </p>

                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                        <input 
                            type="text"
                            value={forgotUser}
                            onChange={e => setForgotUser(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Nome de usuário ou e-mail"
                        />
                        
                        <button 
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Verificar
                        </button>
                    </form>

                    {forgotMsg && (
                        <div className={`p-4 rounded-lg text-sm flex items-start gap-3 ${forgotMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {forgotMsg.type === 'success' ? <CheckCircle size={20} className="shrink-0"/> : <AlertCircle size={20} className="shrink-0"/>}
                            <span>{forgotMsg.text}</span>
                        </div>
                    )}

                    <button 
                        onClick={() => setShowForgot(false)}
                        className="w-full text-center text-sm text-gray-400 hover:text-gray-600"
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