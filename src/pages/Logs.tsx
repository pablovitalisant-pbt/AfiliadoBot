import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ListTodo, CheckCircle2, Clock, Smartphone, MessageSquare } from 'lucide-react';

export default function Logs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/logs', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Historial de Envíos</h1>
        <div className="text-xs text-gray-500 flex items-center">
          <Clock className="w-3 h-3 mr-1" /> Últimos 100 mensajes
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
               <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead</th>
               <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mensaje</th>
               <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-100 text-sm">
             {loading ? (
               <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando...</td></tr>
             ) : logs.length === 0 ? (
               <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500 italic">No hay registros aún.</td></tr>
             ) : logs.map((log) => (
               <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                 <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                   {new Date(log.sent_at).toLocaleString('es-CL', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                 </td>
                 <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-800">{log.lead_nombre || 'Desconocido'}</p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{log.lead_url}</p>
                 </td>
                 <td className="px-6 py-4">
                    <div className="flex items-center text-xs font-medium text-indigo-600">
                       <MessageSquare className="w-3 h-3 mr-1" /> DM{log.dm}
                       <span className="text-[10px] text-gray-400 ml-2">(Var #{log.mensaje_variant})</span>
                    </div>
                 </td>
                 <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 ring-1 ring-green-600/10">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {log.estado.toUpperCase()}
                    </span>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}
