import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon,
  Video,
  ChevronLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  FileText,
  Info,
  Scale,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeBovineImage } from '../services/gemini';
import { BovineAnalysisResult } from '../types';

export default function ImageAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BovineAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImage(base64);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false
  } as any);

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const base64Data = image.split(',')[1];
      const analysisResult = await analyzeBovineImage(base64Data);
      setResult(analysisResult);
    } catch (err) {
      console.error(err);
      setError("Falha ao analisar a imagem. Verifique sua conexão e tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (result) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto space-y-6 pb-12"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setResult(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold">Resultado da Análise</h2>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        {/* Image Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-lg border border-gray-200 bg-white">
          <img 
            src={image!} 
            alt="Animal Analisado" 
            className="w-full aspect-[4/3] object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl flex items-center justify-between border border-white/20">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-1 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Análise Concluída</span>
            </div>
            <span className="text-sm text-gray-500 font-mono">ID: {result.id}</span>
          </div>
        </div>

        {/* Race & Weight Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Raça Identificada</p>
              <h3 className="text-3xl font-black text-gray-900">{result.raca}</h3>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-100">
              {result.confianca_raca}% Confiança
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Peso Estimado</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{result.peso_estimado}</span>
                <span className="text-gray-500 font-medium">kg</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">± {result.precisao_peso} Precisão</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cor da Pelagem</p>
              <p className="text-xl font-bold text-gray-900">{result.cor_pelagem}</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{result.padrao_pelagem}</p>
            </div>
          </div>
        </div>

        {/* Detailed Description Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h4 className="flex items-center gap-2 font-bold text-gray-800">
            <FileText className="w-5 h-5 text-blue-500" />
            Descrição Detalhada
          </h4>
          
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sexo</p>
              <p className="font-bold text-gray-900">{result.sexo}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Idade Estimada</p>
              <p className="font-bold text-gray-900">{result.idade_estimada}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Score Corporal</p>
              <p className="font-bold text-gray-900">{result.score_corporal}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Porte</p>
              <p className="font-bold text-gray-900">{result.porte}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Características Observadas</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {result.descricao_detalhada}
            </p>
          </div>
        </div>

        {/* Specialist Observations */}
        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-4">
          <h4 className="flex items-center gap-2 font-bold text-emerald-800">
            <Info className="w-5 h-5" />
            Observações do Especialista AI
          </h4>
          <ul className="space-y-3">
            {result.observacoes_especialista.map((obs, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-emerald-900 font-medium">{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <button className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all">
            <Save className="w-5 h-5" />
            Salvar no Rebanho
          </button>
          <button className="w-full bg-white text-gray-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 transition-all">
            <FileText className="w-5 h-5" />
            Exportar Relatório PDF
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col">
      <div className="flex-1 relative rounded-[40px] overflow-hidden bg-black shadow-2xl border-4 border-white/10 group">
        {!image ? (
          <div {...getRootProps()} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
            <input {...getInputProps()} />
            <div className="absolute inset-0 opacity-40">
              <img 
                src="https://picsum.photos/seed/cow/800/1200" 
                alt="Background" 
                className="w-full h-full object-cover blur-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="relative z-10 text-center p-8">
              <div className="bg-white/20 backdrop-blur-xl p-6 rounded-full inline-block mb-6 border border-white/30">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pronto para Analisar</h3>
              <p className="text-white/70">Toque para capturar ou arraste uma foto</p>
            </div>

            {/* Camera Overlays */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-12 w-16 h-16 border-t-4 border-l-4 border-white/40 rounded-tl-3xl" />
              <div className="absolute top-1/4 right-12 w-16 h-16 border-t-4 border-r-4 border-white/40 rounded-tr-3xl" />
              <div className="absolute bottom-1/4 left-12 w-16 h-16 border-b-4 border-l-4 border-white/40 rounded-bl-3xl" />
              <div className="absolute bottom-1/4 right-12 w-16 h-16 border-b-4 border-r-4 border-white/40 rounded-br-3xl" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0">
            <img 
              src={image} 
              alt="Preview" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20" />
            
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-6">
              {isAnalyzing ? (
                <div className="bg-white/90 backdrop-blur-xl px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  <span className="font-bold text-gray-900">Processando Visão AI...</span>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setImage(null)}
                    className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                  <button 
                    onClick={handleAnalyze}
                    className="bg-emerald-500 text-white px-10 py-5 rounded-full font-black text-lg shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <Target className="w-6 h-6" />
                    ANALISAR AGORA
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <div className="bg-black/40 backdrop-blur-xl border border-white/20 px-6 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Sistema Pronto para Análise</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <button className="bg-emerald-900/10 border border-emerald-900/20 p-4 rounded-3xl flex items-center justify-center gap-3 hover:bg-emerald-900/20 transition-all">
          <ImageIcon className="w-6 h-6 text-emerald-900" />
          <span className="font-bold text-emerald-900">Galeria</span>
        </button>
        <button className="bg-gray-100 border border-gray-200 p-4 rounded-3xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all">
          <Video className="w-6 h-6 text-gray-600" />
          <span className="font-bold text-gray-600">Vídeo</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
