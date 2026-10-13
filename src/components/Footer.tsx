import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FooterProps {
  onAdminLoginSuccess: (token: string) => void;
  isAdminLoggedIn: boolean;
  onOpenAdminPanel: () => void;
}

export default function Footer({ onAdminLoginSuccess, isAdminLoggedIn, onOpenAdminPanel }: FooterProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        onAdminLoginSuccess(data.token);
        setShowLoginModal(false);
        // Clear login form
        setEmail('');
        setPassword('');
      } else {
        const data = await response.json();
        setErrorMsg(data.message || 'Credenciais inválidas.');
      }
    } catch (err) {
      console.error('Login request error:', err);
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-black text-gray-400 py-12 border-t border-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Logo & brand */}
          <div className="space-y-4">
            <div className="flex items-baseline font-sans text-2xl font-extrabold tracking-tight">
              <span className="text-orange-500">I</span>
              <span className="text-white">mbloco</span>
            </div>
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              Imbloco Construtora e Imobiliária Ltda. Solidez, inovação e sustentabilidade em cada metro quadrado construído.
            </p>
            <p className="text-[10px] text-gray-600">CRECI: J-99999 • CNPJ: 12.345.678/0001-90</p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">A Construtora</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#about" className="hover:text-orange-500 transition-colors">Sobre Nós</a></li>
              <li><a href="#projects" className="hover:text-orange-500 transition-colors">Nossos Empreendimentos</a></li>
              <li><a href="#standards" className="hover:text-orange-500 transition-colors">Diferenciais Técnicos</a></li>
              <li><a href="#careers" className="hover:text-orange-500 transition-colors">Trabalhe Conosco</a></li>
            </ul>
          </div>

          {/* Column 3: Legal compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legais</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#privacy" className="hover:text-orange-500 transition-colors">Política de Privacidade</a></li>
              <li><a href="#terms" className="hover:text-orange-500 transition-colors">Termos de Uso</a></li>
              <li><a href="#cookies" className="hover:text-orange-500 transition-colors">Configurações de Cookies</a></li>
              <li><a href="#complaints" className="hover:text-orange-500 transition-colors">Canal de Ética</a></li>
            </ul>
          </div>

          {/* Column 4: Certifications badges mock */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Certificações</h4>
            <div className="flex gap-2">
              <span className="text-[9px] font-bold text-gray-400 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded tracking-wider uppercase">ISO 9001</span>
              <span className="text-[9px] font-bold text-gray-400 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded tracking-wider uppercase">PBQP-H Nível A</span>
            </div>
            <p className="text-[10px] text-gray-600 font-light mt-2">Tecnologia construtiva de ponta e auditorias regulares de qualidade.</p>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Hidden Admin triggers */}
        <div className="pt-8 border-t border-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-gray-500">
          <p>© {new Date().getFullYear()} Imbloco Construtora e Imobiliária. Todos os direitos reservados.</p>
          
          {/* Hidden Admin Access Trigger */}
          <div className="flex items-center gap-2">
            {isAdminLoggedIn ? (
              <button
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-semibold cursor-pointer transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                Acessar Painel Administrador
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="opacity-25 hover:opacity-100 text-gray-600 hover:text-gray-300 font-mono text-[9px] transition-opacity cursor-pointer flex items-center gap-1"
                title="Acesso reservado para equipe Imbloco"
              >
                <Lock className="w-2.5 h-2.5" /> Área Restrita / Admin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Login Floating Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close login */}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setErrorMsg('');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors cursor-pointer text-xs font-bold"
              >
                Fechar
              </button>

              <div className="text-center space-y-1.5 mb-6">
                <Lock className="w-9 h-9 text-orange-600 mx-auto bg-orange-50 p-2 rounded-full" />
                <h3 className="text-base font-bold text-black uppercase tracking-wider">Acesso Administrativo</h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed">
                  Insira as credenciais autorizadas da Imbloco para gerenciar leads, properties e schedules.
                </p>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mb-4 text-center">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email field */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    placeholder="adm@adm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Senha de Segurança</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-400 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  {loading ? 'Validando...' : 'Entrar no Painel'}
                </button>
              </form>

              {/* Reminder notice */}
              <div className="mt-4 pt-3.5 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-mono">Homologação: adm@adm.com / 123456</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
}
