import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrarse');

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-10 border border-gray-100">
        <div className="flex justify-center mb-8">
           <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-emerald-500/20">A</div>
        </div>
        <h2 className="text-2xl font-black text-center text-gray-900 mb-2 tracking-tight">AfiliadoBot</h2>
        <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mb-10">Crear Nueva Cuenta</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-xs font-bold text-center border border-red-100">{error}</div>}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1 text-left">Nombre completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50/50 transition-all text-sm"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1 text-left">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50/50 transition-all text-sm"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1 text-left">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50/50 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/20 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform active:scale-[0.98]"
          >
            {loading ? 'Preparando...' : 'Registrar Cuenta'}
          </button>
        </form>
        <p className="mt-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
          ¿Ya tienes cuenta? <Link to="/login" className="text-emerald-600 hover:text-emerald-500 transition-colors ml-2">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
}
