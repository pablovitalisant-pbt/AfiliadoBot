import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Calendar, Hash, Save, Shield } from 'lucide-react';

export default function Config() {
  const { token } = useAuth();
  const [config, setConfig] = useState<any>({
    max_daily: 20,
    start_hour: 9,
    end_hour: 18,
    allowed_days: [1, 2, 3, 4, 5]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bot/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data) setConfig(data);
        setLoading(false);
      });
  }, [token]);

  const toggleDay = (day: number) => {
    const days = config.allowed_days.includes(day)
      ? config.allowed_days.filter((d: number) => d !== day)
      : [...config.allowed_days, day];
    setConfig({ ...config, allowed_days: days });
  };

  const handleSave = async () => {
    const res = await fetch('/api/bot/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(config)
    });
    if (res.ok) alert('Configuración guardada correctamente');
  };

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Bot</h1>
        <p className="text-gray-500 text-sm mt-1">Define los límites y horarios de operación automática.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* Daily Limit */}
        <div className="space-y-4">
           <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
             <Hash className="w-4 h-4 mr-2 text-emerald-500" /> Mensajes Diarios
           </div>
           <div className="flex items-center space-x-6">
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={config.max_daily}
                onChange={(e) => setConfig({ ...config, max_daily: parseInt(e.target.value) })}
                className="flex-1 h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="w-16 text-center font-black text-emerald-600 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100 text-sm">
                {config.max_daily}
              </span>
           </div>
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Límite recomendado: 50/día</p>
        </div>

        {/* Operating Hours */}
        <div className="space-y-4 pt-8 border-t border-gray-50">
           <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
             <Clock className="w-4 h-4 mr-2 text-emerald-500" /> Horario Activo (Chile)
           </div>
           <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2 tracking-widest opacity-60">Hora inicio</label>
                <select
                  value={config.start_hour}
                  onChange={(e) => setConfig({ ...config, start_hour: parseInt(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2 tracking-widest opacity-60">Hora fin</label>
                <select
                  value={config.end_hour}
                  onChange={(e) => setConfig({ ...config, end_hour: parseInt(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
           </div>
        </div>

        {/* Operating Days */}
        <div className="space-y-4 pt-8 border-t border-gray-50">
           <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
             <Calendar className="w-4 h-4 mr-2 text-emerald-500" /> Días de Operación
           </div>
           <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    config.allowed_days.includes(d)
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/10'
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {dayNames[d - 1]}
                </button>
              ))}
           </div>
        </div>

        <div className="pt-8 border-t border-gray-50">
           <button
             onClick={handleSave}
             className="w-full flex items-center justify-center bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
           >
             <Save className="w-5 h-5 mr-3" /> Actualizar Ajustes
           </button>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start space-x-3">
         <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
         <p className="text-xs text-orange-700 leading-relaxed">
           <strong>Seguridad de Cuenta:</strong> AfiliadoBot utiliza intervalos aleatorios de entre 15 y 45 segundos por mensaje para simular comportamiento humano y reducir el riesgo de ser detectado como spam por WhatsApp.
         </p>
      </div>
    </div>
  );
}
