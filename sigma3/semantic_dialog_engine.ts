/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║   SIGMA 3.0 FINALITY × QANTUM SEMANTIC DIALOGUE ENGINE (TS SOURCE)            ║
 * ║   Integrated from Desktop TypeScript Modules:                                 ║
 * ║   1. FeatureVectorizer (1,2-gram TF-IDF) & NaiveBayesClassifier (Softmax)     ║
 * ║   2. VectorOps (256-D DJB2 Embeddings + Cosine Similarity) & SemanticMemory   ║
 * ║   3. AdaptiveSemanticCore (Bidirectional Synonyms + DOM Action Executor)      ║
 * ║   4. CognitiveBridge ReAct Loop (Thought -> Action -> Observation -> Anchor)  ║
 * ║   5. SemanticIntentMapper (Optional Ollama Neural Bridge + 0ms Fallback)      ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

export interface TrainingSample {
  text: string;
  intent: string;
}

export interface ClassificationResult {
  text: string;
  intent: string;
  confidence: number;
  alternatives: Array<{ intent: string; probability: number }>;
}

export interface MemoryEntry {
  id: string;
  vector: number[];
  content: string;
  metadata: {
    type: 'pattern' | 'fact' | 'concept' | 'experience';
    domain: string;
    tags: string[];
    confidence: number;
    timestamp: string;
    entityKey?: string;
  };
}

export interface ReActTrace {
  thought: string;
  action: string;
  observation: string;
  anchorAlignment: number;
  nbIntent: string;
  nbConfidence: number;
  vectorSimilarity: number;
  memorySize: number;
  uiActionExecuted?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. VECTOR OPS (256-D DJB2 HASH EMBEDDINGS + CHARACTER N-GRAMS + COSINE SIM)
// ═══════════════════════════════════════════════════════════════════════════════
export class VectorOps {
  static textToVector(text: string, dimension: number = 256): number[] {
    const vector = new Array<number>(dimension).fill(0);
    const clean = String(text || '').toLowerCase().replace(/[^\wа-яa-z0-9\s]/g, ' ');
    const words = clean.split(/\s+/).filter((w) => w.length >= 2);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const posWeight = 1 / (1 + Math.log(1 + i));
      const h = this.hashString(word);
      vector[h % dimension] += posWeight * 1.4;

      // Character 3-grams for typo-resilient subword embeddings
      const padded = `^${word}$`;
      for (let k = 0; k <= padded.length - 3; k++) {
        const tri = padded.slice(k, k + 3);
        const th = this.hashString(tri);
        vector[th % dimension] += posWeight * 0.45;
      }
    }

    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map((v) => v / magnitude);
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  private static hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return Math.abs(hash);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. FEATURE VECTORIZER (TF-IDF N-GRAMS [1, 2]) & NAIVE BAYES CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════════
export class FeatureVectorizer {
  private maxFeatures: number;
  private ngrams: number[];
  public vocabulary: Map<string, number> = new Map();
  public idf: Map<string, number> = new Map();
  public fitted: boolean = false;

  constructor(maxFeatures: number = 1800, ngrams: number[] = [1, 2]) {
    this.maxFeatures = maxFeatures;
    this.ngrams = ngrams;
  }

  fit(documents: string[]): this {
    const docCount = documents.length;
    const termDocCount = new Map<string, number>();

    for (const doc of documents) {
      const tokens = this.tokenize(doc);
      const ngrams = this.getNgrams(tokens);
      const seen = new Set<string>();
      for (const ng of ngrams) {
        if (!seen.has(ng)) {
          seen.add(ng);
          termDocCount.set(ng, (termDocCount.get(ng) || 0) + 1);
        }
      }
    }

    const sorted = Array.from(termDocCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.maxFeatures);

    this.vocabulary.clear();
    sorted.forEach(([term], idx) => this.vocabulary.set(term, idx));

    for (const [term, count] of termDocCount) {
      if (this.vocabulary.has(term)) {
        this.idf.set(term, Math.log(docCount / (1 + count)) + 1);
      }
    }
    this.fitted = true;
    return this;
  }

  transform(document: string): Float32Array {
    const vector = new Float32Array(this.vocabulary.size);
    if (!this.fitted) return vector;
    const tokens = this.tokenize(document);
    const ngrams = this.getNgrams(tokens);
    const tf = new Map<string, number>();

    for (const ng of ngrams) {
      tf.set(ng, (tf.get(ng) || 0) + 1);
    }
    for (const [term, freq] of tf) {
      const idx = this.vocabulary.get(term);
      if (idx !== undefined) {
        vector[idx] = freq * (this.idf.get(term) || 1);
      }
    }
    let norm = 0;
    for (let i = 0; i < vector.length; i++) norm += vector[i] * vector[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) vector[i] /= norm;
    }
    return vector;
  }

  fitTransform(documents: string[]): Float32Array[] {
    this.fit(documents);
    return documents.map((d) => this.transform(d));
  }

  private tokenize(text: string): string[] {
    return String(text || '')
      .toLowerCase()
      .replace(/[^\wа-яa-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  private getNgrams(tokens: string[]): string[] {
    const res: string[] = [];
    for (const n of this.ngrams) {
      for (let i = 0; i <= tokens.length - n; i++) {
        res.push(tokens.slice(i, i + n).join(' '));
      }
    }
    return res;
  }
}

export class NaiveBayesClassifier {
  private alpha: number;
  public classes: string[] = [];
  private classPriors: Map<string, number> = new Map();
  private featureProbabilities: Map<string, Float32Array> = new Map();
  public trained: boolean = false;

  constructor(alpha: number = 0.65) {
    this.alpha = alpha;
  }

  train(X: Float32Array[], y: string[]): this {
    this.classes = [...new Set(y)];
    const nSamples = X.length;
    const nFeatures = X[0]?.length || 0;
    const classCounts = new Map<string, number>();

    for (const label of y) {
      classCounts.set(label, (classCounts.get(label) || 0) + 1);
    }
    for (const [cls, count] of classCounts) {
      this.classPriors.set(cls, count / nSamples);
    }

    for (const cls of this.classes) {
      const indices: number[] = [];
      y.forEach((lbl, idx) => { if (lbl === cls) indices.push(idx); });
      const probs = new Float32Array(nFeatures);
      for (let f = 0; f < nFeatures; f++) {
        let sum = 0;
        for (const i of indices) sum += X[i][f];
        probs[f] = (sum + this.alpha) / (indices.length + this.alpha * nFeatures);
      }
      this.featureProbabilities.set(cls, probs);
    }
    this.trained = true;
    return this;
  }

  predictProbabilities(x: Float32Array): Map<string, number> {
    const logProbs = new Map<string, number>();
    for (const cls of this.classes) {
      let lp = Math.log(this.classPriors.get(cls) || 1e-6);
      const fp = this.featureProbabilities.get(cls)!;
      for (let f = 0; f < x.length; f++) {
        if (x[f] > 0) lp += x[f] * Math.log(fp[f] + 1e-10);
      }
      logProbs.set(cls, lp);
    }
    const maxLp = Math.max(...logProbs.values());
    let sumExp = 0;
    for (const lp of logProbs.values()) sumExp += Math.exp(lp - maxLp);
    const probs = new Map<string, number>();
    for (const [cls, lp] of logProbs) {
      probs.set(cls, Math.exp(lp - maxLp) / (sumExp || 1));
    }
    return probs;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SEMANTIC MEMORY BANK (WITH BROWSER LOCALSTORAGE PERSISTENCE)
// ═══════════════════════════════════════════════════════════════════════════════
export class SemanticMemoryBank {
  private entries: Map<string, MemoryEntry> = new Map();
  private dimension: number = 256;
  private storageKey: string = 'sigma3_qantum_semantic_memory_v1';

  constructor() {
    this.loadFromStorage();
  }

  memorize(content: string, meta: Partial<MemoryEntry['metadata']> = {}): MemoryEntry {
    const vector = VectorOps.textToVector(content, this.dimension);
    for (const existing of this.entries.values()) {
      if (VectorOps.cosineSimilarity(vector, existing.vector) > 0.94) {
        existing.metadata.confidence = Math.min(1, existing.metadata.confidence + 0.08);
        existing.metadata.timestamp = new Date().toISOString();
        this.saveToStorage();
        return existing;
      }
    }
    const id = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const entry: MemoryEntry = {
      id,
      vector,
      content,
      metadata: {
        type: meta.type || 'fact',
        domain: meta.domain || 'procurement',
        tags: meta.tags || [],
        confidence: meta.confidence ?? 0.85,
        timestamp: new Date().toISOString(),
        entityKey: meta.entityKey,
      },
    };
    this.entries.set(id, entry);
    if (this.entries.size > 450) {
      const firstKey = this.entries.keys().next().value;
      if (firstKey) this.entries.delete(firstKey);
    }
    this.saveToStorage();
    return entry;
  }

  query(queryText: string, limit: number = 5, threshold: number = 0.28): Array<{ entry: MemoryEntry; similarity: number }> {
    const qVec = VectorOps.textToVector(queryText, this.dimension);
    const res: Array<{ entry: MemoryEntry; similarity: number }> = [];
    for (const entry of this.entries.values()) {
      const sim = VectorOps.cosineSimilarity(qVec, entry.vector);
      if (sim >= threshold) {
        res.push({ entry, similarity: sim * entry.metadata.confidence });
      }
    }
    res.sort((a, b) => b.similarity - a.similarity);
    return res.slice(0, limit);
  }

  get size(): number {
    return this.entries.size;
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((e: MemoryEntry) => this.entries.set(e.id, e));
          }
        }
      }
    } catch {}
  }

  private saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const userEntries = Array.from(this.entries.values()).filter((e) => e.metadata.type === 'experience').slice(-60);
        localStorage.setItem(this.storageKey, JSON.stringify(userEntries));
      }
    } catch {}
  }
}
