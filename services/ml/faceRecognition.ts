// Mock implementation for development; will require react-native-tensorflow-lite in dev build
// and actual .tflite model in assets/

export const faceRecognition = {
  /**
   * Calculates cosine similarity between two embeddings
   * @param embedding1 Float32Array (128-d)
   * @param embedding2 Float32Array (128-d)
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  },

  /**
   * Processes a camera frame and returns a match or null
   */
  async matchFace(capturedEmbedding: number[], storedEmbeddings: { id: string, embedding: number[] }[]) {
    const THRESHOLD = 0.82; // Requirements: > 0.82 = match
    const UNCERTAIN = 0.70; // Requirements: 0.70-0.82 = uncertain (orange)

    let bestMatch = { id: '', score: 0 };

    for (const stored of storedEmbeddings) {
      const score = this.calculateSimilarity(capturedEmbedding, stored.embedding);
      if (score > bestMatch.score) {
        bestMatch = { id: stored.id, score };
      }
    }

    if (bestMatch.score >= THRESHOLD) return { ...bestMatch, status: 'match' as const };
    if (bestMatch.score >= UNCERTAIN) return { ...bestMatch, status: 'uncertain' as const };
    
    return null;
  }
};
