/**
 * Calculates the Euclidean distance between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Euclidean distance
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  
  return Math.sqrt(sum);
}

/**
 * Calculates the Manhattan distance between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Manhattan distance
 */
export function manhattanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  
  return sum;
}

/**
 * Calculates the cosine similarity between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity (between -1 and 1, higher means more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += Math.pow(a[i], 2);
    magnitudeB += Math.pow(b[i], 2);
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Converts distance to similarity score (0-1)
 * @param distance Distance value
 * @param maxDistance Maximum possible distance to normalize
 * @returns Similarity score between 0 and 1
 */
export function distanceToSimilarity(distance: number, maxDistance: number = 1): number {
  return 1 - Math.min(1, distance / maxDistance);
}

/**
 * Calculate similarity percentage for display
 * @param similarity Similarity value between 0 and 1
 * @returns Percentage string
 */
export function similarityToPercentage(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}
