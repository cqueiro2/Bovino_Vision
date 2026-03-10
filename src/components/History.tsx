import React, { useEffect, useState } from 'react';
import { 
  History as HistoryIcon, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllAnalyses, deleteAnalysis, updateAnalysis, SavedAnalysis } from '../services/db';

export default function History() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<SavedAnalysis>>({});

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAnalyses();
      setAnalyses(data);
    } catch (err) {
      setError("Falha ao carregar histórico.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta análise?")) return;
    try {
      await deleteAnalysis(id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
      if (selectedAnalysis?.id === id) setSelectedAnalysis(null);
    } catch (err) {
      alert("Falha ao excluir.");
    }
  };

  const handleUpdate = async () => {
    if (!selectedAnalysis) return;
    try {
      await updateAnalysis(selectedAnalysis.id, editData);
      setAnalyses(prev => prev.map(a => a.id === selectedAnalysis.id ? { ...a, ...editData } : a));
      setSelectedAnalysis(prev => prev ? { ...prev, ...editData } : null);
      setIsEditing(false);
    } catch (err) {
      alert("Falha ao atualizar.");
    }
  };

  const startEditing = () => {
    setEditData({
      raca: selectedAnalysis?.raca,
      peso_estimado: selectedAnalysis?.peso_estimado,
      saude_geral: selectedAnalysis?.saude_geral
    });
    setIsEditing(true);
  };

  const filteredAnalyses = analyses.filter(a => 
    a.raca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Histórico de Análises</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por raça ou ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64"
          />
        </div>
      </div>

      {filteredAnalyses.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border border-gray-200 shadow-sm text-center max-w-md mx-auto mt-12">
          <HistoryIcon className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum Registro</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Nenhuma análise encontrada para sua busca.' : 'Suas análises salvas aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnalyses.map((analysis) => (
            <motion.div 
              key={analysis.id}
              layoutId={analysis.id}
              onClick={() => setSelectedAnalysis(analysis)}
              className="bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="relative aspect-video">
                <img 
                  src={analysis.image_data} 
                  alt={analysis.raca} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleDelete(analysis.id, e)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    analysis.saude_geral === 'Saudável' ? 'bg-emerald-500 text-white' :
                    analysis.saude_geral === 'Atenção' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {analysis.saude_geral}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{analysis.raca}</h3>
                  <span className="text-xs font-mono text-gray-400">#{analysis.id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <HistoryIcon className="w-4 h-4" />
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </div>
                  <div className="font-bold text-gray-900">{analysis.peso_estimado} kg</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnalysis(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              layoutId={selectedAnalysis.id}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedAnalysis(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-64 md:h-auto">
                  <img 
                    src={selectedAnalysis.image_data} 
                    alt={selectedAnalysis.raca} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8 md:p-12 space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {isEditing ? (
                        <select 
                          value={editData.saude_geral}
                          onChange={(e) => setEditData({ ...editData, saude_geral: e.target.value as any })}
                          className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 border-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="Saudável">Saudável</option>
                          <option value="Atenção">Atenção</option>
                          <option value="Crítico">Crítico</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          selectedAnalysis.saude_geral === 'Saudável' ? 'bg-emerald-100 text-emerald-700' :
                          selectedAnalysis.saude_geral === 'Atenção' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedAnalysis.saude_geral}
                        </span>
                      )}
                      <span className="text-xs font-mono text-gray-400">ID: {selectedAnalysis.id}</span>
                    </div>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editData.raca}
                        onChange={(e) => setEditData({ ...editData, raca: e.target.value })}
                        className="text-4xl font-black text-gray-900 bg-gray-50 border-none rounded-xl w-full focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <h2 className="text-4xl font-black text-gray-900">{selectedAnalysis.raca}</h2>
                    )}
                    <p className="text-gray-500 font-medium mt-1">Analisado em {new Date(selectedAnalysis.created_at).toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Peso Estimado</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            value={editData.peso_estimado}
                            onChange={(e) => setEditData({ ...editData, peso_estimado: Number(e.target.value) })}
                            className="text-2xl font-bold text-gray-900 bg-gray-50 border-none rounded-xl w-24 focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="text-gray-500 font-medium">kg</span>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{selectedAnalysis.peso_estimado} kg</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sexo / Idade</p>
                      <p className="text-lg font-bold text-gray-900">{selectedAnalysis.sexo} • {selectedAnalysis.idade_estimada}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descrição Técnica</p>
                    <p className="text-gray-600 leading-relaxed">{selectedAnalysis.descricao_detalhada}</p>
                  </div>

                  <div className="pt-8 border-t border-gray-100 flex gap-4">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleUpdate}
                          className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                        >
                          Salvar Alterações
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={startEditing}
                          className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                        >
                          <Edit3 className="w-5 h-5" />
                          Editar Dados
                        </button>
                        <button className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200">
                          <ExternalLink className="w-5 h-5" />
                          Ver Laudo
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
