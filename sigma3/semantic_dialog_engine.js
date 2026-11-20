/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║   NAsvetlo ORACLE — CALIBRATED SEMANTIC DIALOGUE ENGINE (PRODUCTION RUNTIME) ║
 * ║   1. FeatureVectorizer (Stopword-Filtered 1,2-gram TF-IDF + Subwords)        ║
 * ║   2. Calibrated NaiveBayesClassifier (Honest Abstention + Margin Guard)      ║
 * ║   3. VectorOps (256-D Stopword-Filtered Embeddings + Cosine Similarity)      ║
 * ║   4. SemanticMemoryBank (High-Precision Vector RAG + Clean v2 Storage)       ║
 * ║   5. Autonomous UI Action Executor (Theme, Density, Top-50, Shortest Path)   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */
(() => {
  'use strict';

  const NLU_STOP_WORDS = new Set([
    'кажи', 'кажете', 'ми', 'за', 'покажи', 'покажете', 'провери', 'проверете',
    'какво', 'какви', 'какъв', 'каква', 'има', 'имат', 'няма', 'са', 'е', 'бе', 'беше',
    'в', 'във', 'на', 'от', 'до', 'по', 'със', 'с', 'или', 'и', 'а', 'но', 'че', 'защото',
    'кой', 'кои', 'коя', 'кое', 'колко', 'къде', 'кога', 'как', 'защо', 'всички', 'всичко',
    'дай', 'дайте', 'информация', 'данни', 'справка', 'одит', 'моля', 'те', 'искам', 'да',
    'видя', 'разкажи', 'намери', 'потърси', 'извади', 'списък', 'таблица', 'относно', 'около',
    'при', 'между', 'след', 'преди', 'над', 'под', 'най', 'много', 'малко', 'големи', 'голям',
    'голяма', 'ли', 'се', 'си', 'му', 'й', 'им', 'ги', 'го', 'я', 'това', 'тази', 'този',
    'тези', 'там', 'тук', 'него', 'нея', 'тях', 'ти', 'вие', 'ние', 'аз', 'мен', 'теб',
    'тебе', 'твой', 'твоя', 'твое', 'твоите', 'ваш', 'ваша', 'вашите', 'можеш', 'може',
    'мога', 'можете', 'можем', 'правиш', 'прави', 'правя', 'правите', 'правим', 'направи',
    'направиш', 'нещо', 'нищо', 'някой', 'някои', 'които', 'който', 'която', 'което',
    'само', 'вече', 'още', 'така', 'тука', 'нали', 'българия', 'фирма', 'фирми', 'компания',
    'компании', 'институция', 'институции', 'поръчка', 'поръчки', 'договор', 'договори',
    'обществени', 'обществена', 'пари', 'сума', 'суми', 'евро', 'лева',
  ]);

  // ===========================================================================
  // 1. VECTOR OPS (256-D STOPWORD-FILTERED WORD + SUBWORD EMBEDDINGS)
  // ===========================================================================
  class VectorOps {
    static hashString(str) {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
      }
      return Math.abs(hash);
    }

    static textToVector(text, dimension = 256) {
      const vector = new Float32Array(dimension);
      const clean = String(text || '').toLowerCase().replace(/[^а-яa-z0-9\s]/g, ' ');
      const words = clean.split(/\s+/).filter((w) => w.length >= 3 && !NLU_STOP_WORDS.has(w));
      if (!words.length) return vector;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const posWeight = 1 / (1 + Math.log(1 + i));
        const h = this.hashString(word);
        vector[h % dimension] += posWeight * 1.85;

        // Character 4-grams reduce random Bulgarian suffix collisions dramatically vs 3-grams
        if (word.length >= 4) {
          const padded = `^${word}$`;
          for (let k = 0; k <= padded.length - 4; k++) {
            const quad = padded.slice(k, k + 4);
            const qh = this.hashString(quad);
            vector[qh % dimension] += posWeight * 0.42;
          }
        }
      }

      let mag = 0;
      for (let i = 0; i < dimension; i++) mag += vector[i] * vector[i];
      if (mag === 0) return vector;
      mag = Math.sqrt(mag);
      for (let i = 0; i < dimension; i++) vector[i] /= mag;
      return vector;
    }

    static cosineSimilarity(a, b) {
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
  }

  // ===========================================================================
  // 2. FEATURE VECTORIZER (TF-IDF N-GRAMS [1, 2]) & CALIBRATED NAIVE BAYES
  // ===========================================================================
  class FeatureVectorizer {
    constructor(options = {}) {
      this.maxFeatures = options.maxFeatures || 2400;
      this.ngrams = options.ngrams || [1, 2];
      this.vocabulary = new Map();
      this.idf = new Map();
      this.fitted = false;
    }

    _tokenize(text, keepConversational = false) {
      return String(text || '')
        .toLowerCase()
        .replace(/[^а-яa-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1 && (keepConversational || !NLU_STOP_WORDS.has(t)));
    }

    _getNgrams(tokens) {
      const words = [];
      const subwords = [];
      for (const n of this.ngrams) {
        for (let i = 0; i <= tokens.length - n; i++) {
          words.push(tokens.slice(i, i + n).join(' '));
        }
      }
      // 4-char subwords preserve typo resilience while eliminating 3-char false positives
      for (const tk of tokens) {
        if (tk.length >= 5) {
          for (let i = 0; i <= tk.length - 4; i++) {
            subwords.push(`#${tk.slice(i, i + 4)}`);
          }
        }
      }
      return { words, subwords, all: [...words, ...subwords] };
    }

    fit(documents) {
      const docCount = documents.length;
      const termDocCount = new Map();
      for (const doc of documents) {
        const tokens = this._tokenize(doc, false);
        const { all } = this._getNgrams(tokens);
        const seen = new Set();
        for (const ng of all) {
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

    transformWithStats(document) {
      const vector = new Float32Array(this.vocabulary.size);
      if (!this.fitted) return { vector, wordHitCount: 0, subwordHitCount: 0, tokenCount: 0 };
      const tokens = this._tokenize(document, false);
      const { words, subwords } = this._getNgrams(tokens);
      const tf = new Map();
      let wordHitCount = 0;
      let subwordHitCount = 0;
      const matchedWords = new Set();
      const matchedSubs = new Set();

      for (const w of words) {
        if (this.vocabulary.has(w)) {
          tf.set(w, (tf.get(w) || 0) + 1.35);
          matchedWords.add(w);
        }
      }
      for (const sw of subwords) {
        if (this.vocabulary.has(sw)) {
          tf.set(sw, (tf.get(sw) || 0) + 0.55);
          matchedSubs.add(sw);
        }
      }
      wordHitCount = matchedWords.size;
      subwordHitCount = matchedSubs.size;

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
      return { vector, wordHitCount, subwordHitCount, tokenCount: tokens.length };
    }

    transform(document) {
      return this.transformWithStats(document).vector;
    }

    fitTransform(documents) {
      this.fit(documents);
      return documents.map((d) => this.transform(d));
    }
  }

  class NaiveBayesClassifier {
    constructor(alpha = 0.5) {
      this.alpha = alpha;
      this.classes = [];
      this.classPriors = new Map();
      this.featureProbabilities = new Map();
      this.trained = false;
    }

    train(X, y) {
      this.classes = [...new Set(y)];
      const nFeatures = X[0] ? X[0].length : 0;
      // Uniform class priors prevent corpus-size bias (e.g., COMPARE winning on empty input)
      const uniformPrior = 1 / (this.classes.length || 1);
      for (const cls of this.classes) this.classPriors.set(cls, uniformPrior);

      for (const cls of this.classes) {
        const classIndices = [];
        y.forEach((lbl, i) => { if (lbl === cls) classIndices.push(i); });
        const featureProbs = new Float32Array(nFeatures);
        for (let f = 0; f < nFeatures; f++) {
          let sum = 0;
          for (const i of classIndices) sum += X[i][f];
          featureProbs[f] = (sum + this.alpha) / (classIndices.length + this.alpha * nFeatures);
        }
        this.featureProbabilities.set(cls, featureProbs);
      }
      this.trained = true;
      return this;
    }

    predictProbabilities(x) {
      const logProbs = new Map();
      for (const cls of this.classes) {
        let logProb = Math.log(this.classPriors.get(cls) || 1e-6);
        const featureProbs = this.featureProbabilities.get(cls);
        for (let f = 0; f < x.length; f++) {
          if (x[f] > 0) {
            logProb += x[f] * Math.log(featureProbs[f] + 1e-10) * 3.8;
          }
        }
        logProbs.set(cls, logProb);
      }
      const maxLogProb = Math.max(...logProbs.values());
      let sumExp = 0;
      for (const lp of logProbs.values()) sumExp += Math.exp(lp - maxLogProb);
      const probs = new Map();
      for (const [cls, lp] of logProbs) {
        probs.set(cls, Math.exp(lp - maxLogProb) / (sumExp || 1));
      }
      return probs;
    }
  }

  class IntentClassifier {
    constructor() {
      this.vectorizer = new FeatureVectorizer({ maxFeatures: 2600, ngrams: [1, 2] });
      this.classifier = new NaiveBayesClassifier(0.5);
      this.trainingData = [];
      this.trained = false;
    }

    addExamples(examples) {
      for (const ex of examples) this.trainingData.push(ex);
      return this;
    }

    train() {
      const texts = this.trainingData.map((d) => d.text);
      const labels = this.trainingData.map((d) => d.intent);
      const X = this.vectorizer.fitTransform(texts);
      this.classifier.train(X, labels);
      this.trained = true;
      return this;
    }

    classify(text) {
      if (!this.trained) this.train();
      const { vector, wordHitCount, subwordHitCount } = this.vectorizer.transformWithStats(text);

      // Honest abstention: never invent an intent when zero real domain words matched
      if (wordHitCount === 0 && subwordHitCount < 3) {
        return {
          text,
          intent: null,
          confidence: 0,
          margin: 0,
          wordHitCount: 0,
          abstained: true,
          alternatives: [],
        };
      }

      const probs = this.classifier.predictProbabilities(vector);
      const sorted = Array.from(probs.entries()).sort((a, b) => b[1] - a[1]);
      const top = sorted[0];
      const second = sorted[1] || [null, 0];
      if (!top) {
        return { text, intent: null, confidence: 0, margin: 0, wordHitCount, abstained: true, alternatives: [] };
      }

      const margin = top[1] - second[1];
      const confident = (wordHitCount >= 1 && top[1] >= 0.42 && margin >= 0.14)
        || (wordHitCount >= 2 && top[1] >= 0.34 && margin >= 0.10);

      return {
        text,
        intent: confident ? top[0] : null,
        confidence: confident ? top[1] : 0,
        rawTopIntent: top[0],
        rawTopConfidence: top[1],
        margin,
        wordHitCount,
        abstained: !confident,
        alternatives: sorted.slice(1, 4).map(([intent, probability]) => ({ intent, probability })),
      };
    }
  }

  // ===========================================================================
  // 3. BIDIRECTIONAL SYNONYM EXPANDER
  // ===========================================================================
  const INTENT_SYNONYMS = {
    'самовъзлагане': ['сам на себе си', 'собствената институция', 'собствена община', 'конфликт на интереси', 'свои фирми', 'кмет печели', 'общинари печелят', 'роднинска фирма'],
    'дззд': ['консорциум', 'обединение', 'скрити фирми', 'без еик', 'мега консорциум', 'скрити поръчки', 'dzzd'],
    'xml': ['декларация', 'декларации', 'сметна палата', 'пропуснати от сигма', 'нови политици', 'частни заеми', 'акции', 'таблица 9', 'чл 35'],
    'съд': ['дела', 'дело', 'търговски спор', 'осъден', 'неустойки', 'спогодба', 'епеп', 'еисс', 'присъда', 'съдебен', 'арбитраж', 'окръжен съд'],
    'адфи': ['инспекция', 'финансова инспекция', 'ревизия', 'глоба', 'глоби', 'наказателно постановление', 'ауан', 'канд', 'безнаказаност', 'чл 17', 'отменено нп', 'adfi'],
    'кзк': ['върховен административен съд', 'предварително изпълнение', 'чл 205', 'обжалване', 'жалба', 'блокаж', 'спряна поръчка', 'отменено решение', 'kzk'],
    'адвокат': ['адвокати', 'юрист', 'юрисконсулт', 'кантора', 'кантори', 'правни услуги', 'вещо лице', 'вещи лица', 'експерт', 'строителен надзор'],
    'фалит': ['несъстоятелност', 'ликвидация', 'запор', 'запори', 'особен залог', 'чси', 'дългове', 'феникс', 'изгаряне', 'burnout', 'спряла фирма'],
    'европрокуратура': ['eppo', 'еппо', 'кьовеши', 'еврофондове', 'ес средства', 'европейски пари', 'змип', 'действителен собственик', 'офшорка'],
    'анекс': ['анекси', 'оскъпяване', 'оскъпени', 'инфлация', 'допълнително споразумение', 'увеличена цена', 'чл 116', 'дъмпинг'],
    'куха': ['кухи фирми', 'фантом', 'фантоми', 'новосъздадена', 'вчерашна фирма', '2 лева капитал', 'без история', 'shell'],
    'разделяне': ['салами', 'salami', 'раздробяване', 'нацепване', 'под прага', 'заобикаляне на търг', 'чл 20'],
    'дарения': ['дарители', 'ерик', 'партийни', 'спонсори', 'медии', 'телевизии', 'пиар', 'реклама', 'кампания'],
    'декември': ['петък', 'ноември', 'края на годината', 'коледа', 'бюджетен дъмпинг', 'времеви аномалии', 'последния момент'],
    'картел': ['картели', 'ротация', 'редуване', 'общ адрес', 'един и същ адрес', 'двойки фирми', 'съвместни оферти', 'сговаряне'],
    'шити': ['нагласени', 'спецификация', 'дискриминационни', 'ограничителни', 'чл 49', 'технически критерии'],
    'монопол': ['1 оферта', 'една оферта', 'без конкуренция', 'единствен участник', 'пряко договаряне', 'директно възлагане', 'hhi'],
    'бенфорд': ['парето', 'джини', 'gini', 'лоренц', 'статистически одит', 'математически', 'топ 1%'],
    'сигнал': ['жалба до', 'доклад до', 'официална справка', 'прокуратура', 'кпк', 'кпконпи', 'експорт'],
    'сравни': ['сравнение', 'разлика между', 'срещу', 'съпостави'],
    'помощ': ['възможности', 'функции', 'инструкция', 'ръководство', 'команди', 'примери', 'умееш', 'работиш'],
    'източници': ['методология', 'статистика', 'актуалност', 'регистри', 'отворени данни'],
  };

  function expandTextWithSynonyms(text) {
    const lower = String(text || '').toLowerCase();
    const additions = new Set();
    for (const [canonical, syns] of Object.entries(INTENT_SYNONYMS)) {
      if (lower.includes(canonical)) {
        additions.add(canonical);
      }
      for (const syn of syns) {
        if (lower.includes(syn)) {
          additions.add(canonical);
          break;
        }
      }
    }
    return additions.size ? `${lower} ${Array.from(additions).join(' ')}` : lower;
  }

  // ===========================================================================
  // 4. PRE-TRAINED BULGARIAN AUDIT NLU CORPUS
  // ===========================================================================
  const TRAINING_CORPUS = [
    // HELP_CAPABILITIES
    { text: 'помощ възможности функции команди инструкция ръководство примери', intent: 'HELP_CAPABILITIES' },
    { text: 'умееш работиш служиш обясни платформата асистента оракула', intent: 'HELP_CAPABILITIES' },
    { text: 'какви справки одити проверки функции поддържа асистентът', intent: 'HELP_CAPABILITIES' },
    // PLATFORM_OVERVIEW
    { text: 'източници методология актуалност регистри отворени данни обща статистика', intent: 'PLATFORM_OVERVIEW' },
    { text: 'откъде идват данните официални регистри сигма цаис еоп сметна палата', intent: 'PLATFORM_OVERVIEW' },
    { text: 'обобщение макрорамка общ обем милиарда договори възложители изпълнители', intent: 'PLATFORM_OVERVIEW' },
    // COMPARE
    { text: 'сравни област бургас област варна разлика сравнение', intent: 'COMPARE' },
    { text: 'сравнението пловдив стара загора риск сравнителен профил', intent: 'COMPARE' },
    { text: 'съпостави софия благоевград коя община повече самовъзлагане', intent: 'COMPARE' },
    { text: 'бургас срещу варна хасково сравнителен профил', intent: 'COMPARE' },
    // SIGNAL
    { text: 'генерирай официален сигнал адфи кпк прокуратурата eppo', intent: 'SIGNAL' },
    { text: 'жалба одитна справка политик кмет сигнал експорт', intent: 'SIGNAL' },
    { text: 'изготви сигнал конфликт интереси самовъзлагане печат', intent: 'SIGNAL' },
    // SELF_DEALING
    { text: 'кметове общинари самовъзлагане собствената институция собствена община', intent: 'SELF_DEALING' },
    { text: 'лицата печелят собствената институция община конфликт интереси', intent: 'SELF_DEALING' },
    { text: 'директен конфликт интереси политици собствената община роднински', intent: 'SELF_DEALING' },
    // HIDDEN_DZZD
    { text: 'скрити дззд консорциуми обединения без еик', intent: 'HIDDEN_DZZD' },
    { text: 'политици крият зад консорциум обединение милиарди', intent: 'HIDDEN_DZZD' },
    { text: 'разбий мега консорциумите реалните собственици дззд', intent: 'HIDDEN_DZZD' },
    // XML_DECLARATIONS
    { text: 'нови политици xml декларациите сметната палата пропуснати сигма', intent: 'XML_DECLARATIONS' },
    { text: 'скрити частни заеми акции таблица 7 таблица 9 декларации чл 35', intent: 'XML_DECLARATIONS' },
    { text: 'пропуснато xml файловете сметна палата декларации', intent: 'XML_DECLARATIONS' },
    // JUDICIAL_TD
    { text: 'търговски дела спорове съда изпълнители епеп еисс', intent: 'JUDICIAL_TD' },
    { text: 'осъдени общини агенции неустойки неизпълнение фиктивни спогодби втд', intent: 'JUDICIAL_TD' },
    { text: 'съдебни дела окръжния апелативния съд търговски спорове еисс', intent: 'JUDICIAL_TD' },
    // JUDICIAL_ADFI
    { text: 'адфи индекс безнаказаността ревизии финансови инспекции доклади чл 17', intent: 'JUDICIAL_ADFI' },
    { text: 'отменени наказателни постановления глоби адфи съда канд', intent: 'JUDICIAL_ADFI' },
    { text: 'съдът отменя актовете глобите адфи маловажен случай чл 28 занн давност', intent: 'JUDICIAL_ADFI' },
    // JUDICIAL_KZK_VAS
    { text: 'кзк жалби предварително изпълнение чл 205 зоп окончателни решения вас', intent: 'JUDICIAL_KZK_VAS' },
    { text: 'върховен административен съд четвърто отделение отменени решения кзк', intent: 'JUDICIAL_KZK_VAS' },
    { text: 'блокаж обжалване кзк вас спрени отменено решение', intent: 'JUDICIAL_KZK_VAS' },
    // JUDICIAL_LAWYERS
    { text: 'мрежа адвокати адвокатски кантори юрисконсулти вещи лица', intent: 'JUDICIAL_LAWYERS' },
    { text: 'адвокати строителен надзор обслужват общини дела епеп', intent: 'JUDICIAL_LAWYERS' },
    { text: 'вещите лица адфи правни консултанти адвокатски кантори', intent: 'JUDICIAL_LAWYERS' },
    // JUDICIAL_PHOENIX
    { text: 'несъстоятелност фалит ликвидация запори чси нап особени залози', intent: 'JUDICIAL_PHOENIX' },
    { text: 'феникс изгорели burnout ликвидационен дългов срив прехвърлят дейност', intent: 'JUDICIAL_PHOENIX' },
    { text: 'запори върху дяловете търговския регистър дългове несъстоятелност', intent: 'JUDICIAL_PHOENIX' },
    // JUDICIAL_EPPO
    { text: 'европейска прокуратура eppo кьовеши злоупотреби ес средства еврофондове', intent: 'JUDICIAL_EPPO' },
    { text: 'европейско финансиране оферта липсващ действителен собственик змип', intent: 'JUDICIAL_EPPO' },
    { text: 'офшорни чуждестранни майки високорискови европроекти eppo', intent: 'JUDICIAL_EPPO' },
    // FORENSIC_ANNEX
    { text: 'анекси оскъпяване подписване допълнителни споразумения чл 116', intent: 'FORENSIC_ANNEX' },
    { text: 'спечелени евтино дъмпинг цената вдигната двойно анекс', intent: 'FORENSIC_ANNEX' },
    { text: 'инфлация увеличение стойността договори анекси', intent: 'FORENSIC_ANNEX' },
    // FORENSIC_SHELL
    { text: 'кухи новосъздадени фантоми регистрирани дни преди търга капитал', intent: 'FORENSIC_SHELL' },
    { text: 'вчерашни без история персонал печелят милиони кухи', intent: 'FORENSIC_SHELL' },
    // FORENSIC_SALAMI
    { text: 'разделяне под прага салами слайсинг salami slicing заобикаляне търг', intent: 'FORENSIC_SALAMI' },
    { text: 'нацепване раздробяване малки суми законовия праг чл 20 зоп', intent: 'FORENSIC_SALAMI' },
    // FORENSIC_POLITICS_MEDIA
    { text: 'политически дарения ерик спонсори партийни медии телевизии пиар агенции', intent: 'FORENSIC_POLITICS_MEDIA' },
    { text: 'дарители кампанията партийни медийни агенции реклама', intent: 'FORENSIC_POLITICS_MEDIA' },
    // FORENSIC_TIME
    { text: 'времеви аномалии подписани петък вечер коледа края декември', intent: 'FORENSIC_TIME' },
    { text: 'бюджетен дъмпинг ноември декември изхарчване бюджета последния момент', intent: 'FORENSIC_TIME' },
    // FORENSIC_CARTEL
    { text: 'картели картелна ротация редуване победители общ адрес', intent: 'FORENSIC_CARTEL' },
    { text: 'участват заедно консорциуми въртят схема съвместни оферти картел', intent: 'FORENSIC_CARTEL' },
    // FORENSIC_NLP
    { text: 'шити нагласени ограничителни условия конкретни марки чл 49 зоп', intent: 'FORENSIC_NLP' },
    { text: 'дискриминационни технически спецификации критерии конкретна марка', intent: 'FORENSIC_NLP' },
    // SINGLE_OFFER_HHI
    { text: 'една оферта без конкуренция пряко договаряне hhi монопол', intent: 'SINGLE_OFFER_HHI' },
    { text: 'единствен доставчик без търг концентрация монопол', intent: 'SINGLE_OFFER_HHI' },
    // BENFORD_PARETO
    { text: 'математически статистически закона бенфорд крива лоренц парето джини', intent: 'BENFORD_PARETO' },
    { text: 'хиперконцентрация първа цифра бенфорд джини парето', intent: 'BENFORD_PARETO' },
    // SECTOR_CIRCLE
    { text: 'депутатите народното събрание парламента министрите болниците службите данс дато мвр', intent: 'SECTOR_CIRCLE' },
    { text: 'кметове общински съветници общините министерства болници', intent: 'SECTOR_CIRCLE' },
    // HIGH_RISK_OVERVIEW
    { text: 'краде далавери корупция схеми червени флагове злоупотреби', intent: 'HIGH_RISK_OVERVIEW' },
    { text: 'топ рискови политици общини класацията пирамидата', intent: 'HIGH_RISK_OVERVIEW' },
    // UI_NAVIGATION
    { text: 'отвори графа връзките картата областите превключи тъмен режим', intent: 'UI_NAVIGATION' },
    { text: 'намери пътя връзката графа включи одиторски изглед пирамидата', intent: 'UI_NAVIGATION' },
  ];

  // ===========================================================================
  // 5. SEMANTIC MEMORY BANK (HIGH-PRECISION v2)
  // ===========================================================================
  class SemanticMemoryBank {
    constructor() {
      this.entries = new Map();
      this.dimension = 256;
      this.storageKey = 'nasvetlo_oracle_memory_v2';
      this.corpusIndexed = false;
      this.loadFromStorage();
    }

    memorize(content, metadata = {}) {
      const vector = VectorOps.textToVector(content, this.dimension);
      const id = metadata.id || `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const entry = {
        id,
        vector,
        content,
        metadata: {
          type: metadata.type || 'fact',
          domain: metadata.domain || 'sigma3',
          tags: metadata.tags || [],
          confidence: metadata.confidence ?? 0.9,
          timestamp: new Date().toISOString(),
          actionPayload: metadata.actionPayload || null,
        },
      };
      this.entries.set(id, entry);
      if (metadata.type === 'experience') this.saveToStorage();
      return entry;
    }

    query(queryText, limit = 5, threshold = 0.42) {
      const expanded = expandTextWithSynonyms(queryText);
      const qVec = VectorOps.textToVector(expanded, this.dimension);
      let hasSignal = false;
      for (let i = 0; i < qVec.length; i++) {
        if (qVec[i] !== 0) { hasSignal = true; break; }
      }
      if (!hasSignal) return [];

      const results = [];
      for (const entry of this.entries.values()) {
        const sim = VectorOps.cosineSimilarity(qVec, entry.vector);
        if (sim >= threshold) {
          results.push({ entry, similarity: sim, relevance: sim * (entry.metadata.confidence || 0.9) });
        }
      }
      results.sort((a, b) => b.relevance - a.relevance);
      return results.slice(0, limit);
    }

    indexLiveDatasets(state, auths, comps, j6, f7) {
      if (this.corpusIndexed) return;
      this.corpusIndexed = true;

      (state.officials || []).slice(0, 80).forEach((o) => {
        this.memorize(
          `Длъжностно лице ${o.name} (${o.primaryInstitution}, ${o.circle}, ${o.oblast || ''}) — В мандата: ${o.periodEur} EUR, Общо+ДЗЗД: ${o.combinedEur} EUR, Риск ${o.sigma3Score}/100. Фирми: ${(o.companies || []).map((c) => `${c.name} ЕИК ${c.eik}`).join(', ')}`,
          { id: `off_${o.slug}`, type: 'fact', domain: 'official', actionPayload: { slug: o.slug } }
        );
      });

      (auths || []).slice(0, 60).forEach((a) => {
        this.memorize(
          `Възложител ${a.name} ЕИК ${a.eik} (${a.region || ''}, ${a.settlement || ''}) — Разход по ЗОП: ${a.spentEur} EUR, ${a.contracts} договора, Риск ${a.riskScore}/100`,
          { id: `auth_${a.eik}`, type: 'fact', domain: 'authority', actionPayload: { authorityEik: a.eik } }
        );
      });

      (comps || []).slice(0, 60).forEach((c) => {
        this.memorize(
          `Изпълнител ${c.name} ЕИК ${c.eik || 'ДЗЗД'} (${c.settlement || ''}) — Спечелени: ${c.wonEur} EUR, Чрез ДЗЗД: ${c.consortiumEur} EUR, ${c.contracts} договора`,
          { id: `comp_${c.eik || c.name.slice(0, 20)}`, type: 'fact', domain: 'company', actionPayload: { companyKey: c.eik || c.name } }
        );
      });

      if (j6) {
        ((j6.module1_collusiveLitigation && j6.module1_collusiveLitigation.liveEissCommercialDisputes) || []).forEach((c, i) => {
          this.memorize(
            `Търговско дело ${c.court} ${c.caseNo}: ${c.sideLeft} срещу ${c.sideRight} (${c.authorityName} ЕИК ${c.authorityEik} ↔ ${c.contractorName || ''}) — ${c.outcome}. Диспозитив: ${(c.disposition || '').slice(0, 180)}`,
            { id: `td_${i}`, type: 'fact', domain: 'judicial_td', actionPayload: { authorityEik: c.authorityEik, url: c.actDownloadUrl } }
          );
        });
        ((j6.module2_impunityIndex && j6.module2_impunityIndex.liveEissAndKandCases) || []).forEach((c, i) => {
          this.memorize(
            `Административнонаказателно дело КАНД ${c.court} ${c.caseNo} по НП ${c.npNo || ''} на ${c.agency} за ${c.authorityName} (ЕИК ${c.authorityEik || ''}) — ${c.outcome} (${c.annulmentReason || ''}). ${(c.disposition || '').slice(0, 160)}`,
            { id: `kand_${i}`, type: 'fact', domain: 'judicial_adfi', actionPayload: { authorityEik: c.authorityEik, url: c.actDownloadUrl } }
          );
        });
        ((j6.module4_kzkVas && j6.module4_kzkVas.liveVasFinalActs) || []).forEach((v, i) => {
          this.memorize(
            `Окончателен акт на ВАС Четвърто отделение адм.д. ${v.vasCaseNo} по КЗК ${v.kzkDossierNo || ''}: жалбоподател ${v.appellantName} срещу възложител ${v.authorityName} — ${v.vasOutcome}. ${(v.disposition || '').slice(0, 160)}`,
            { id: `vas_${i}`, type: 'fact', domain: 'judicial_vas', actionPayload: { authorityEik: v.authorityEik, url: v.actDownloadUrl } }
          );
        });
      }

      if (f7) {
        ((f7.engine1_annexInflation && f7.engine1_annexInflation.contracts) || []).slice(0, 25).forEach((c, i) => {
          this.memorize(
            `Анекс и оскъпяване (+${c.inflationPct}%, +${c.inflationEur} EUR): ${c.authority} към ${c.contractor} — ${c.subject || ''}`,
            { id: `annex_${i}`, type: 'fact', domain: 'forensic_annex', actionPayload: { contractId: c.id } }
          );
        });
      }
    }

    loadFromStorage() {
      try {
        if (typeof localStorage === 'undefined') return;
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            arr.forEach((e) => {
              e.vector = VectorOps.textToVector(e.content, this.dimension);
              this.entries.set(e.id, e);
            });
          }
        }
      } catch {}
    }

    saveToStorage() {
      try {
        if (typeof localStorage === 'undefined') return;
        const exp = Array.from(this.entries.values())
          .filter((e) => e.metadata && e.metadata.type === 'experience')
          .slice(-30)
          .map((e) => ({ id: e.id, content: e.content, metadata: e.metadata }));
        localStorage.setItem(this.storageKey, JSON.stringify(exp));
      } catch {}
    }
  }

  // ===========================================================================
  // 6. AUTONOMOUS UI ACTION EXECUTOR
  // ===========================================================================
  function detectAndExecuteUIAction(cyrQuery) {
    if (typeof document === 'undefined') return null;
    const q = String(cyrQuery || '').toLowerCase();
    if (/\b(тъмен режим|тъмна тема|светъл режим|светла тема|dark mode|light mode)\b/.test(q)) {
      document.getElementById('themeToggleBtn')?.click();
      return 'Превключих интерфейса между светъл и тъмен режим.';
    }
    if (/\b(одиторски изглед|компактен изглед|презентационен изглед)\b/.test(q)) {
      document.getElementById('densityToggleBtn')?.click();
      return 'Превключих плътността на таблиците (Одиторски / Презентационен изглед).';
    }
    if (/\b(отвори пирамидата|отвори залата|покажи пирамидата|отвори топ 50)\b/.test(q)) {
      document.getElementById('hofOpenBtn')?.click();
      return 'Отворих прозореца с Йерархичния профил на концентрацията (Топ 50).';
    }
    const pathMatch = q.match(/(?:път|пътя|връзка|връзката)\s+между\s+([а-яa-z0-9\s.-]+?)\s+и\s+([а-яa-z0-9\s.-]+)$/i);
    if (pathMatch && window.SIGMA3_MOD) {
      const fromEnt = pathMatch[1].trim();
      const toEnt = pathMatch[2].trim();
      const fromInp = document.getElementById('pathFromInput');
      const toInp = document.getElementById('pathToInput');
      if (fromInp && toInp) {
        fromInp.value = fromEnt;
        toInp.value = toEnt;
        document.getElementById('btnFindPath')?.click();
        return `Стартирах търсене на най-кратка връзка в 9-възловия граф между „${fromEnt}“ и „${toEnt}“.`;
      }
    }
    return null;
  }

  // ===========================================================================
  // 7. BOOTSTRAP SINGLETON ENGINE
  // ===========================================================================
  const classifier = new IntentClassifier();
  classifier.addExamples(TRAINING_CORPUS.map((s) => ({
    text: expandTextWithSynonyms(s.text),
    intent: s.intent,
  })));
  classifier.train();

  const memoryBank = new SemanticMemoryBank();

  function evaluateCognitivePipeline(rawQuery, cyrQuery, fullNorm, state, auths, comps, j6, f7) {
    memoryBank.indexLiveDatasets(state, auths, comps, j6, f7);
    const expandedQuery = expandTextWithSynonyms(fullNorm);

    const nbResult = classifier.classify(expandedQuery);
    const ragMatches = memoryBank.query(expandedQuery, 5, 0.42);
    const uiActionMsg = detectAndExecuteUIAction(cyrQuery);

    // Only reinforce high-confidence non-abstained audit queries
    if (!nbResult.abstained && nbResult.intent && nbResult.confidence >= 0.55) {
      memoryBank.memorize(`Въпрос: ${cyrQuery} -> Категория: ${nbResult.intent}`, {
        type: 'experience',
        domain: nbResult.intent,
        confidence: nbResult.confidence,
      });
    }

    const topVectorSim = ragMatches.length ? ragMatches[0].similarity : 0;

    return {
      nbResult,
      ragMatches,
      uiActionMsg,
      memorySize: memoryBank.entries.size,
      topVectorSim,
      anchorAlignment: (!nbResult.abstained || ragMatches.length > 0) ? 1.0 : 0,
    };
  }

  const root = typeof window !== 'undefined' ? window : globalThis;
  root.SIGMA3_SEMANTIC_ENGINE = {
    VectorOps,
    FeatureVectorizer,
    NaiveBayesClassifier,
    IntentClassifier,
    SemanticMemoryBank,
    classifier,
    memoryBank,
    expandTextWithSynonyms,
    evaluateCognitivePipeline,
  };
})();
