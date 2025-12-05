import React from 'react';
import { ShoppingBag, Heart } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-2xl shadow-xl mb-8">
        <ShoppingBag size={64} className="text-white" />
      </div>
      
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">
        Vendas360
      </h1>
      <p className="text-gray-500 text-lg mb-8 max-w-md">
        Sistema integrado de gestão de comissões, vendas e inteligência comercial.
      </p>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl w-full text-left space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Sobre o Sistema</h2>
        <p className="text-gray-600">
            Versão: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm text-gray-800">2.1.0 (Web)</span>
        </p>
        <p className="text-gray-600">
            Este aplicativo foi desenvolvido para otimizar o fluxo de representantes comerciais, permitindo cálculo preciso de margens complexas (Cesta Básica e Natal) e controle financeiro pessoal integrado.
        </p>
        
        <div className="pt-4 mt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Créditos</h3>
            <div className="flex items-center space-x-2 text-gray-800">
                <span>Desenvolvido com</span>
                <Heart size={16} className="text-red-500 fill-current" />
                <span>por <strong>Hypelab</strong></span>
                <span className="text-2xl ml-2">🇧🇷</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
                Todos os direitos reservados.
            </p>
        </div>
      </div>
    </div>
  );
};

export default About;