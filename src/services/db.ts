import { BovineAnalysisResult } from "../types";

export interface SavedAnalysis extends BovineAnalysisResult {
  image_data: string;
  created_at: string;
}

export async function saveAnalysis(result: BovineAnalysisResult, imageData: string) {
  const response = await fetch("/api/analyses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...result, image_data: imageData }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.details 
      ? `Failed to save analysis: ${errorData.details}` 
      : (errorData.error || "Failed to save analysis");
    throw new Error(errorMessage);
  }
  
  return response.json();
}

export async function getAllAnalyses(): Promise<SavedAnalysis[]> {
  const response = await fetch("/api/analyses");
  if (!response.ok) throw new Error("Failed to fetch analyses");
  return response.json();
}

export async function deleteAllAnalyses() {
  const response = await fetch("/api/analyses", {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete all analyses");
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('all-analyses-deleted'));
  
  return response.json();
}

export async function deleteAnalysis(id: string) {
  const response = await fetch(`/api/analyses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete analysis");
  }
  
  // Dispatch custom event for other components to react
  window.dispatchEvent(new CustomEvent('analysis-deleted', { detail: { id } }));
  
  return response.json();
}

export async function updateAnalysis(id: string, data: Partial<SavedAnalysis>) {
  const response = await fetch(`/api/analyses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update analysis");
  return response.json();
}
