import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, TrendingUp, MessageCircle, Clock, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>({ totalLeads: 0, sentToday: 0, pendingFollowups: 0, connected: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [botRes, leadsRes, waRes] = await Promise.all([
          fetch('/api/bot/status', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/whatsapp/status', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const bot = await botRes.json();
        const leads = await leadsRes.json();
        const wa = await waRes.json();

        setStats({
          totalLeads: leads.length || 0,
          sentToday: bot.dailyCount || 0,
          pendingFollowups: Array.isArray(leads) ? leads.filter((l: any) => l.estado === 'dm' && l.f3 && !l.f3.dm1_respondio).length : 0,
          connected: wa.connected || false
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };
    if (token) fetchData();
  }, [token]);

  const cards = [
    { title: 'Leads Totales', value: stats.totalLeads, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Mensajes Hoy', value: `${stats.sentToday} / ${stats.maxDaily || 20}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', progress: (stats.sentToday / (stats.maxDaily || 20)) * 100 },
    { title: 'Pendientes', value: stats.pendingFollowups, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Estado WA', value: stats.connected ? 'Conectado' : 'Desconectado', icon: MessageCircle, color: stats.connected ? 'text-emerald-600' : 'text-red-600', status: stats.connected },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
              <div className="flex flex-col h-full">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.title}</p>
                <div className="flex items-end justify-between mt-auto">
                   <div>
                      {card.status !== undefined ? (
                        <div className="flex items-center gap-2 mt-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${card.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                             {card.value}
                           </span>
                        </div>
                      ) : (
                        <p className="text-2xl font-black text-gray-900">{card.value}</p>
                      )}
                      
                      {card.progress !== undefined && (
                        <div className="w-24 bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                           <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(card.progress, 100)}%` }}></div>
                        </div>
                      )}
                   </div>
                   <div className={`${card.bg} ${card.color} p-2 rounded-lg transition-transform group-hover:scale-110 shadow-sm`}>
                      <Icon className="w-5 h-5" />
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-gray-800 tracking-tight">Actividad de Envíos</h3>
            <Link to="/logs" className="text-xs font-bold text-emerald-600 hover:underline">Ver todos los logs</Link>
          </div>
          <div className="flex-1 p-8 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
             <div className="p-4 bg-gray-50 rounded-full text-gray-300">
                <TrendingUp className="w-8 h-8" />
             </div>
             <div>
                <p className="text-sm font-bold text-gray-800">No hay envíos recientes</p>
                <p className="text-xs text-gray-400 mt-1">Los mensajes enviados por el bot aparecerán aquí cronológicamente.</p>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h3 className="font-bold text-gray-800 mb-4 text-sm tracking-tight">Insights de Outreach</h3>
             <div className="space-y-4">
                <div className="bg-emerald-900 rounded-xl p-5 text-white shadow-xl shadow-emerald-900/10">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-800 rounded-lg text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider">Top Receta</p>
                   </div>
                   <p className="text-emerald-100 text-xs leading-relaxed mb-4">
                     Establece tus mensajes en la pestaña <span className="text-white font-bold">Mensajes</span> para empezar a recolectar analíticas de conversión.
                   </p>
                   <div className="flex items-center justify-between text-[10px] bg-emerald-800/50 p-2.5 rounded-lg border border-emerald-700/50 font-bold">
                      <span className="text-emerald-300">Proyección</span>
                      <span className="text-white">-- contactos/mes</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
