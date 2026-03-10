import React from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  Users,
  Scale,
  Calendar
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

const data = [
  { name: 'Seg', peso: 520, saude: 95 },
  { name: 'Ter', peso: 522, saude: 94 },
  { name: 'Qua', peso: 525, saude: 96 },
  { name: 'Qui', peso: 528, saude: 95 },
  { name: 'Sex', peso: 530, saude: 97 },
  { name: 'Sab', peso: 535, saude: 98 },
  { name: 'Dom', peso: 540, saude: 98 },
];

export default function Dashboard() {
  const stats = [
    { label: 'Total do Rebanho', value: '124', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Peso Médio', value: '540 kg', icon: Scale, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Alertas de Saúde', value: '03', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Previsão Abate', value: '12 dias', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
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
            <h3 className="font-semibold text-gray-800">Evolução de Peso Médio (kg)</h3>
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <TrendingUp className="w-4 h-4" />
              +3.8% este mês
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPeso)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-6">Índice de Saúde do Rebanho (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} domain={[90, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="saude" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Análises Recentes</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { action: 'Identificação de Raça: Nelore', animal: 'ID #BV-9842', time: '10 min atrás', status: 'success' },
            { action: 'Alerta de Saúde: Score Baixo', animal: 'ID #BV-7721', time: '2 horas atrás', status: 'warning' },
            { action: 'Estimativa de Peso Concluída', animal: 'ID #BV-1029', time: '5 horas atrás', status: 'info' },
          ].map((item, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'success' ? 'bg-emerald-500' : 
                  item.status === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{item.action}</p>
                  <p className="text-sm text-gray-500">{item.animal}</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
