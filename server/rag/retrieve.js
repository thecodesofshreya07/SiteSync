import { loadAllRetrievableRecords } from './corpus.js'

/**
 * Character 3-gram generator for fuzzy typo tolerance
 */
function getTrigrams(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim()
  const trigrams = new Set()
  const words = clean.split(/\s+/)

  for (const word of words) {
    if (word.length <= 3) {
      trigrams.add(word)
    } else {
      for (let i = 0; i <= word.length - 3; i++) {
        trigrams.add(word.slice(i, i + 3))
      }
    }
  }
  return trigrams
}

/**
 * Jaccard similarity between two sets of n-grams
 */
function trigramSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0
  let intersection = 0
  for (const gram of setA) {
    if (setB.has(gram)) intersection++
  }
  return intersection / (setA.size + setB.size - intersection)
}

/**
 * Levenshtein distance for word-level typo correction
 */
function wordLevenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => [])
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[a.length][b.length]
}

/**
 * Clean & tokenize query
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

// Corpus memory cache
let cachedCorpus = null
let lastBuildTime = 0
const CACHE_TTL_MS = 15000 // refresh every 15s or on demand

export async function getCorpus(forceRefresh = false) {
  const now = Date.now()
  if (!cachedCorpus || forceRefresh || now - lastBuildTime > CACHE_TTL_MS) {
    const rawItems = await loadAllRetrievableRecords()
    cachedCorpus = rawItems.map((item) => ({
      ...item,
      trigrams: getTrigrams(item.text),
      tokens: tokenize(item.text),
    }))
    lastBuildTime = now
  }
  return cachedCorpus
}

/**
 * Retrieve top K most relevant records for any user query with typo-tolerance
 */
export async function retrieve(question, topK = 6, userSiteId = null) {
  const corpus = await getCorpus()
  const qClean = question.toLowerCase()
  const qTrigrams = getTrigrams(qClean)
  const qTokens = tokenize(qClean)

  const isInventoryQuery =
    qClean.includes('inventory') ||
    qClean.includes('stock') ||
    qClean.includes('invejtpry') ||
    qClean.includes('quantity') ||
    qClean.includes('bags') ||
    qClean.includes('cement') ||
    qClean.includes('steel')

  const isProcurementQuery =
    qClean.includes('procurement') ||
    qClean.includes('order') ||
    qClean.includes('purchase') ||
    qClean.includes('po-') ||
    qClean.includes('vendor') ||
    qClean.includes('supplier')

  const isEquipmentQuery =
    qClean.includes('equipment') ||
    qClean.includes('crane') ||
    qClean.includes('machinery') ||
    qClean.includes('utilization') ||
    qClean.includes('idle')

  const scored = corpus.map((doc) => {
    let score = 0

    // 1. Trigram fuzzy similarity (handles typos like 'portalnad' -> 'portland')
    const sim = trigramSimilarity(qTrigrams, doc.trigrams)
    score += sim * 30

    // 2. Word token matches & fuzzy word matches
    for (const qWord of qTokens) {
      if (qWord.length < 3) continue

      let bestWordScore = 0
      for (const dWord of doc.tokens) {
        if (dWord === qWord) {
          bestWordScore = Math.max(bestWordScore, 10)
        } else if (dWord.includes(qWord) || qWord.includes(dWord)) {
          bestWordScore = Math.max(bestWordScore, 6)
        } else if (Math.abs(dWord.length - qWord.length) <= 2) {
          const dist = wordLevenshtein(qWord, dWord)
          if (dist === 1) bestWordScore = Math.max(bestWordScore, 7)
          else if (dist === 2 && qWord.length >= 6) bestWordScore = Math.max(bestWordScore, 4)
        }
      }
      score += bestWordScore
    }

    // 3. Exact ID match boost (e.g. INV-104, PO-2041, SITE-002)
    if (qClean.includes(doc.id.toLowerCase())) {
      score += 50
    }

    // 4. Item / Material exact or fuzzy match boost
    if (doc.item) {
      const itemTrigrams = getTrigrams(doc.item)
      const itemSim = trigramSimilarity(qTrigrams, itemTrigrams)
      score += itemSim * 35
    }

    // 5. Query type alignment boost
    if (isInventoryQuery && doc.type === 'inventory') {
      score += 15
    }
    if (isProcurementQuery && doc.type === 'procurement') {
      score += 15
    }
    if (isEquipmentQuery && doc.type === 'equipment') {
      score += 15
    }

    // 6. Site contextual alignment
    if (userSiteId && doc.siteId === userSiteId) {
      score += 8
    }

    // Match site name in query (e.g. 'metro house' / 'metro heights' / 'riverside' / 'warehouse')
    if (doc.siteName) {
      const siteTrigrams = getTrigrams(doc.siteName)
      const siteSim = trigramSimilarity(qTrigrams, siteTrigrams)
      if (siteSim > 0.3) {
        score += siteSim * 20
      }
    }

    return {
      id: doc.id,
      type: doc.type,
      label: doc.label,
      siteId: doc.siteId,
      siteName: doc.siteName,
      category: doc.category,
      text: doc.text,
      score,
    }
  })

  // Sort descending by relevance score
  const results = scored.sort((a, b) => b.score - a.score).slice(0, topK)
  return results
}
