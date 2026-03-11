import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Target,
  X,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeBovineImage } from '../services/gemini';
import { saveAnalysis } from '../services/db';
import { BovineAnalysisResult } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ImageAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<BovineAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImage(base64);
        setResult(null);
        setError(null);
        setSaveSuccess(false);
        setIsVideoMode(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true // We'll trigger it manually or via the main area
  } as any);

  const startCamera = async () => {
    setIsVideoMode(true);
    setImage(null);
    setResult(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsVideoMode(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoMode(false);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');
        setImage(base64);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (isVideoMode) stopCamera();
    };
  }, [isVideoMode]);

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    setSaveSuccess(false);
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

  const handleSave = async () => {
    if (!result || !image) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveAnalysis(result, image);
      setSaveSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Falha ao salvar no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !result) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F8F9FA',
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              color: inherit !important;
              background-color: inherit !important;
              border-color: rgba(0,0,0,0.1) !important;
              box-shadow: none !important;
              text-shadow: none !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            .text-gray-900 { color: #111827 !important; }
            .text-gray-800 { color: #1f2937 !important; }
            .text-gray-700 { color: #374151 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .text-gray-400 { color: #9ca3af !important; }
            .text-emerald-900 { color: #064e3b !important; }
            .text-emerald-800 { color: #065f46 !important; }
            .text-emerald-700 { color: #047857 !important; }
            .text-emerald-600 { color: #059669 !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-emerald-500 { background-color: #10b981 !important; }
            .bg-emerald-50 { background-color: #ecfdf5 !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`laudo-bovino-${result.id.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Falha ao gerar o PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (result) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-6 pb-12"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              setResult(null);
              setSaveSuccess(false);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg md:text-xl font-bold">Resultado da Análise</h2>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        <div ref={reportRef} className="p-4 md:p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Image Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-lg border border-gray-200 bg-white">
                <img 
                  src={image!} 
                  alt="Animal Analisado" 
                  className="w-full aspect-[4/3] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-[rgba(255,255,255,0.9)] p-4 rounded-2xl flex items-center justify-between border border-[rgba(255,255,255,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-sm md:text-base">Análise Concluída</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono hidden sm:inline">ID: {result.id.slice(0, 8)}</span>
                </div>
              </div>

              {/* Race & Weight Card */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Raça Identificada</p>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900">{result.raca}</h3>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                    {result.confianca_raca}% Confiança
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-8 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Peso Estimado</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl md:text-2xl font-bold text-gray-900">{result.peso_estimado}</span>
                      <span className="text-gray-500 font-medium">kg</span>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">± {result.precisao_peso} Precisão</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cor da Pelagem</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900">{result.cor_pelagem}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{result.padrao_pelagem}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
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
              <div className="bg-[#f0fdf4] p-6 rounded-3xl border border-emerald-100 space-y-4">
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
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving || saveSuccess}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all ${
              saveSuccess 
                ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 disabled:opacity-50'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saveSuccess ? 'Salvo no Rebanho' : 'Salvar no Rebanho'}
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="w-full bg-white text-gray-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Exportar Laudo PDF
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col">
      <div className="flex-1 relative rounded-[40px] overflow-hidden bg-black shadow-2xl border-4 border-white/10 group">
        {!image && !isVideoMode ? (
          <div 
            {...getRootProps()} 
            onClick={() => open()}
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
          >
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
        ) : isVideoMode ? (
          <div className="absolute inset-0 bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute top-8 right-8">
              <button 
                onClick={stopCamera}
                className="p-3 bg-white/20 backdrop-blur-xl rounded-full text-white border border-white/30 hover:bg-white/30"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center">
              <button 
                onClick={captureFrame}
                className="w-20 h-20 bg-white rounded-full border-8 border-white/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-full" />
              </button>
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
              src={image!} 
              alt="Preview" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-[rgba(0,0,0,0.2)]" />
            
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-6">
              {isAnalyzing ? (
                <div className="bg-[rgba(255,255,255,0.9)] backdrop-blur-xl px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  <span className="font-bold text-gray-900">Processando Visão AI...</span>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setImage(null)}
                    className="w-16 h-16 bg-[rgba(255,255,255,0.2)] backdrop-blur-xl rounded-full flex items-center justify-center border border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.3)] transition-all"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                  <button 
                    onClick={handleAnalyze}
                    className="bg-emerald-500 text-white px-10 py-5 rounded-full font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
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
          <div className="bg-[rgba(0,0,0,0.4)] backdrop-blur-xl border border-[rgba(255,255,255,0.2)] px-6 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {isVideoMode ? "Câmera Ativa" : "Sistema Pronto para Análise"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <button 
          onClick={() => open()}
          className="bg-[#f0fdf4] border border-emerald-900/20 p-4 rounded-3xl flex items-center justify-center gap-3 hover:bg-[#dcfce7] transition-all"
        >
          <ImageIcon className="w-6 h-6 text-emerald-900" />
          <span className="font-bold text-emerald-900">Galeria</span>
        </button>
        <button 
          onClick={startCamera}
          className="bg-gray-100 border border-gray-200 p-4 rounded-3xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all"
        >
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
