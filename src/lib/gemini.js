// ============================================================
// DevVerify — Gemini AI Client (Quiz Generation & Evaluation)
// Uses Gemini 1.5 Flash — free tier: 15 RPM, 1M tokens/day
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI = null

function getClient() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY not configured')
    genAI = new GoogleGenerativeAI(key)
  }
  return genAI
}

function getModel() {
  return getClient().getGenerativeModel({ model: 'gemini-1.5-flash' })
}

/**
 * Generate quiz questions for flagged LeetCode problems
 * @param {Array} problems - Array of { title, titleSlug, difficulty }
 * @returns {Array} questions
 */
export async function generateQuizQuestions(problems) {
  const model = getModel()

  const problemList = problems.map((p, i) =>
    `${i + 1}. "${p.title}" (${p.difficulty || 'Unknown'} difficulty, slug: ${p.titleSlug})`
  ).join('\n')

  const prompt = `You are a technical interviewer for a software engineering position. A candidate claims to have solved these LeetCode problems. Generate exactly ${problems.length} questions to verify they actually understand the solutions (not just copied them).

Problems:
${problemList}

For each problem, generate ONE question from these types (vary the types):
- Approach explanation: "Walk me through why [algorithm] works for this problem."
- Edge case handling: "What happens in your solution when [edge case]?"
- Complexity question: "What is the time and space complexity, and why?"
- Variation challenge: "How would your solution change if [constraint change]?"
- Debugging prompt: "This test case [case] might fail. Why, and how would you fix it?"

IMPORTANT RULES:
- Questions should test UNDERSTANDING, not memorization
- A person who genuinely solved the problem should answer easily
- A person who copy-pasted should struggle
- Be specific to the problem, not generic
- Keep each question under 100 words

Return a JSON array with objects having: { "problemTitle", "problemSlug", "questionType", "question", "keyPoints" }
where keyPoints is an array of 3-4 things a correct answer should mention.

Return ONLY the JSON array, no other text.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  // Parse JSON from response (handle markdown code blocks)
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(jsonStr)
  } catch {
    console.error('Failed to parse Gemini response:', text.slice(0, 500))
    throw new Error('Failed to generate quiz questions')
  }
}

/**
 * Evaluate a user's answer to a quiz question
 * @param {Object} question - The question object
 * @param {string} answer - The user's answer
 * @returns {Object} evaluation
 */
export async function evaluateAnswer(question, answer) {
  const model = getModel()

  const prompt = `You are evaluating a developer's explanation of their LeetCode solution.

Problem: "${question.problemTitle}"
Question: "${question.question}"
Expected key points: ${JSON.stringify(question.keyPoints)}

Candidate's answer:
"${answer}"

Evaluate on a 0-100 scale across these dimensions:
1. Correctness (0-40): Does the answer demonstrate correct understanding?
2. Depth (0-30): Does it go beyond surface-level? Mentions edge cases or trade-offs?
3. Clarity (0-30): Is the explanation coherent and well-structured?

Signs of a COPY-PASTE developer:
- Vague, generic answers that could apply to any problem
- Only mentions the algorithm name without explaining WHY it works
- Cannot discuss edge cases
- Textbook-perfect phrasing (likely from an editorial)

Signs of a GENUINE developer:
- Explains the intuition behind the approach
- Mentions specific edge cases they handled
- Discusses alternatives they considered
- Uses natural language, not rehearsed phrases

Return a JSON object: { "score": number, "correctness": number, "depth": number, "clarity": number, "feedback": string, "isLikelyGenuine": boolean }

Return ONLY the JSON, no other text.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(jsonStr)
  } catch {
    console.error('Failed to parse evaluation:', text.slice(0, 500))
    return { score: 50, correctness: 20, depth: 15, clarity: 15, feedback: 'Could not evaluate', isLikelyGenuine: null }
  }
}

/**
 * Generate all quiz questions and return a session object
 */
export async function createQuizSession(problems) {
  const questions = await generateQuizQuestions(problems)
  return {
    questions,
    totalQuestions: questions.length,
    timePerQuestion: 180, // 3 minutes
  }
}
