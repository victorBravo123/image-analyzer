/** Mirror of the backend API contract (POST /api/analyze). */
export interface Tag {
  label: string;
  confidence: number;
}

export interface AnalysisResult {
  tags: Tag[];
}
