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
  if (!response.ok) throw new Error("Failed to save analysis");
  return response.json();
}

export async function getAllAnalyses(): Promise<SavedAnalysis[]> {
  const response = await fetch("/api/analyses");
  if (!response.ok) throw new Error("Failed to fetch analyses");
  return response.json();
}

export async function deleteAnalysis(id: string) {
  const response = await fetch(`/api/analyses/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete analysis");
  return response.json();
}

export async function updateAnalysis(id: string, data: Partial<BovineAnalysisResult>) {
  const response = await fetch(`/api/analyses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update analysis");
  return response.json();
}
