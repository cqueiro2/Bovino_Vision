import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  Users,
  Scale,
  Calendar,
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getAllAnalyses, deleteAnalysis, SavedAnalysis } from '../services/db';

export default function Dashboard() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const handleDeleted = (e: any) => {
      const deletedId = e.detail.id;
      setAnalyses(prev => prev.filter(a => a.id !== deletedId));
    };

    window.addEventListener('analysis-deleted', handleDeleted);
    return () => window.removeEventListener('analysis-deleted', handleDeleted);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAnalyses();
      setAnalyses(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta análise?")) return;
    try {
      await deleteAnalysis(id);
      // O estado é atualizado via evento CustomEvent 'analysis-deleted'
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao excluir.");
    }
  };

  const totalWeight = analyses.reduce((sum, a) => sum + a.peso_estimado, 0);
  const avgWeight = analyses.length > 0 ? totalWeight / analyses.length : 0;
  const totalArrobas = totalWeight / 15; // Standard mathematical conversion: 1@ = 15kg
  const carcassArrobas = totalWeight / 30; // Practical conversion for live cattle (50% yield)
  const healthAlerts = analyses.filter(a => a.saude_geral !== 'Saudável').length;

  // Prepare chart data from last 7 entries or grouped by day
  const chartData = [...analyses].reverse().slice(-7).map(a => ({
    name: new Date(a.created_at).toLocaleDateString('pt-BR', { weekday: 'short' }),
    peso: a.peso_estimado,
    saude: a.saude_geral === 'Saudável' ? 100 : a.saude_geral === 'Atenção' ? 70 : 40
  }));

  const stats = [
    { label: 'Total do Rebanho', value: analyses.length.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Peso Total (@)', value: `${totalArrobas.toFixed(1)} @`, icon: Scale, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Arrobas Carcaça', value: `${carcassArrobas.toFixed(1)} @`, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Alertas de Saúde', value: healthAlerts.toString().padStart(2, '0'), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Carregando dados do rebanho...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <div className="bg-emerald-600 rounded-[32px] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
          <div>
            <h2 className="text-base md:text-lg font-medium opacity-80 mb-1">Peso Total Acumulado</h2>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-6xl font-black tracking-tighter">{totalWeight.toLocaleString()}</span>
              <span className="text-xl md:text-2xl font-bold opacity-70">kg</span>
            </div>
            <p className="text-[rgba(209,250,229,0.6)] text-xs md:text-sm mt-2 font-medium">Baseado em {analyses.length} análises individuais</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-md p-3 md:p-4 rounded-2xl border border-[rgba(255,255,255,0.1)]">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Total Arrobas (@)</p>
              <p className="text-2xl md:text-3xl font-black tracking-tight">{totalArrobas.toFixed(1)}</p>
              <p className="text-[9px] opacity-40 mt-1">1@ = 15kg</p>
            </div>
            <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-md p-3 md:p-4 rounded-2xl border border-[rgba(255,255,255,0.1)]">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Estimativa Carcaça</p>
              <p className="text-2xl md:text-3xl font-black tracking-tight">{carcassArrobas.toFixed(1)}</p>
              <p className="text-[9px] opacity-40 mt-1">@ Líquida (50%)</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-10 pointer-events-none">
          <Scale className="w-64 h-64 md:w-96 md:h-96" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`${stat.bg} p-3 rounded-xl`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800">Evolução de Peso (Últimas Análises)</h3>
            {analyses.length > 1 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                Monitoramento Ativo
              </div>
            )}
          </div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPeso)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                Dados insuficientes para gerar gráfico
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-6">Status de Saúde Individual</h3>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="saude" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                Dados insuficientes para gerar gráfico
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Análises Recentes</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {analyses.slice(0, 5).map((item, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  item.saude_geral === 'Saudável' ? 'bg-emerald-500' : 
                  item.saude_geral === 'Atenção' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{item.raca}</p>
                  <p className="text-sm text-gray-500">ID #{item.id.slice(0, 8)} • {item.peso_estimado} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                <button 
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {analyses.length === 0 && (
            <div className="p-8 text-center text-gray-500 italic">
              Nenhuma análise realizada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
