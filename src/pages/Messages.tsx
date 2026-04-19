import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Upload, FileJson, MessageSquare, Plus, Save } from 'lucide-react';

export default function Messages() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    const res = await fetch('/api/messages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, [token]);

  const downloadTemplate = () => {
    window.open('/api/messages/template', '_blank');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/messages', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(json),
        });
        if (res.ok) fetchMessages();
      } catch (err) {
        alert('Formato JSON inválido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes del Bot</h1>
        <div className="flex space-x-2">
          <button onClick={downloadTemplate} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Plantilla JSON
          </button>
          <label className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <Upload className="w-4 h-4 mr-2" /> Subir Mensajes
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 text-sm font-bold text-gray-700 flex items-center">
          <FileJson className="w-4 h-4 mr-2 text-indigo-500" /> Variantes Configuradas
        </div>
        <div className="divide-y divide-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">DM</th>
                 <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Var</th>
                 <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mensaje Con Nombre</th>
                 <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mensaje Genérico</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-100">
               {loading ? (
                 <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando...</td></tr>
               ) : messages.map((m, i) => (
                 <tr key={i} className="hover:bg-gray-50 transition-colors">
                   <td className="px-6 py-4 text-xs font-bold text-indigo-600">DM{m.dm}</td>
                   <td className="px-6 py-4 text-xs font-medium text-gray-500">#{m.variant}</td>
                   <td className="px-6 py-4 text-xs text-gray-700 max-w-xs truncate" title={m.con_nombre}>{m.con_nombre}</td>
                   <td className="px-6 py-4 text-xs text-gray-700 max-w-xs truncate" title={m.generico}>{m.generico}</td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>

      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
         <h4 className="flex items-center text-indigo-700 font-bold text-sm mb-2">
           <MessageSquare className="w-4 h-4 mr-2" /> Tip pro
         </h4>
         <p className="text-xs text-indigo-600 leading-relaxed">
           Usa el tag <code className="bg-white px-1 rounded border border-indigo-200 font-bold">{"{nombre}"}</code> en el campo "Con Nombre" para que el bot lo reemplace automáticamente por el nombre del lead si este existe en tu base de datos.
         </p>
      </div>
    </div>
  );
}
