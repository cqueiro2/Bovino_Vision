import { GoogleGenAI, Type } from "@google/genai";
import { BovineAnalysisResult } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

export async function analyzeBovineImage(base64Image: string): Promise<BovineAnalysisResult> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: `Você é um sistema avançado de análise visual especializado em bovinos.
          Analise a imagem seguindo estas instruções:
          1. IDENTIFICAÇÃO DA RAÇA: Analise formato corporal, pelagem, padrão de cores, cabeça, orelhas, chifres, musculatura.
          2. ESTIMATIVA DE PESO: Baseie-se em proporções corporais, largura do tórax, altura aparente, condição corporal (score). Informe em kg.
          3. COR E PADRÃO DA PELAGEM: Descreva cor predominante e padrões.
          4. DESCRIÇÃO GERAL: Sexo, idade aproximada, condição corporal, porte, presença de chifres, estado geral.
          
          Retorne o resultado estritamente em JSON seguindo o esquema fornecido.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          raca: { type: Type.STRING },
          confianca_raca: { type: Type.NUMBER },
          peso_estimado: { type: Type.NUMBER },
          precisao_peso: { type: Type.STRING },
          cor_pelagem: { type: Type.STRING },
          padrao_pelagem: { type: Type.STRING },
          sexo: { type: Type.STRING, enum: ["Macho", "Fêmea", "Indeterminado"] },
          idade_estimada: { type: Type.STRING },
          score_corporal: { type: Type.STRING },
          porte: { type: Type.STRING, enum: ["Pequeno", "Médio", "Grande"] },
          descricao_detalhada: { type: Type.STRING },
          observacoes_especialista: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          saude_geral: { type: Type.STRING, enum: ["Saudável", "Atenção", "Crítico"] }
        },
        required: [
          "id", "raca", "confianca_raca", "peso_estimado", "precisao_peso", 
          "cor_pelagem", "padrao_pelagem", "sexo", "idade_estimada", 
          "score_corporal", "porte", "descricao_detalhada", 
          "observacoes_especialista", "saude_geral"
        ]
      }
    }
  });

  return JSON.parse(response.text);
}
