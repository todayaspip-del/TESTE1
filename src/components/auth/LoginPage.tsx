import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, User as UserIcon, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, organization } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const result =
        mode === 'login' ? login(email, password) : register(name, email, password);

      if (!result.ok) {
        setError(result.error);
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-[#0c0b0e] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-none border border-slate-800 bg-[#121418] shadow-2xl p-6 sm:p-8">
          {/* Logo Vulcan */}
          <div className="flex justify-center mb-6">
            <img
              src="https://i.ibb.co/SDLZxn5X/LOGO-VULCAN.png"
              alt="Logo Vulcan"
              referrerPolicy="no-referrer"
              className="max-h-24 sm:max-h-28 w-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 mb-6 rounded-none bg-[#0c0b0e] border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-none text-xs font-bold transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-none text-xs font-bold transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Nome completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-3 py-2.5 rounded-none bg-[#0c0b0e] border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                {mode === 'login' ? 'E-mail ou Usuário' : 'E-mail'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={mode === 'login' ? 'seu_usuario ou email@vulcan.com' : 'voce@instituicao.com'}
                  autoComplete="username"
                  className="w-full pl-10 pr-3 py-2.5 rounded-none bg-[#0c0b0e] border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-none bg-[#0c0b0e] border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded-none border-slate-700 bg-[#0c0b0e] text-orange-600 focus:ring-orange-500"
                  />
                  Lembrar-me
                </label>
                <button type="button" className="text-orange-400 hover:text-orange-300 font-semibold cursor-pointer">
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {error && (
              <div className="text-xs font-semibold text-orange-300 bg-orange-950/40 border border-orange-800/50 rounded-none px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-950/50 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Verificando…' : mode === 'login' ? 'Entrar na Plataforma' : 'Criar minha conta'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-start gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
            <p>
              Cada conta tem acesso individual e auditado. O nível de permissão é definido
              automaticamente pelo domínio institucional do e-mail cadastrado.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          {organization.branding?.motto}
        </p>
      </div>
    </div>
  );
};
