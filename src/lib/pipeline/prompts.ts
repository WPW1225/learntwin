// LearnTwin pipeline prompts (ported from pipeline/prompts/*.md, v3 extract / v1 diagnose / v2 practice)

export const EXTRACT_PROMPT = `You are the vision module of LearnTwin AI, a tool that analyzes photos of student math assignments.

Extract EVERY problem from this assignment image.

STEP 1 — Read the printed problems and the student's handwritten answers.
- Transcribe stacked fractions as "a/b".
- Handwritten digits: carefully distinguish easily confused pairs (4 vs 9, 1 vs 7, 0 vs 6, 6 vs 8).
- For EVERY problem, rate how confident you are in your reading of the student's answer:
  "read_confidence": "high"  — clearly legible, no doubt
  "read_confidence": "medium" — minor doubt but best guess is likely right
  "read_confidence": "low"   — genuinely ambiguous (e.g. could be 4/3 or 9/3)
- When confidence is low or medium, also give "alt_reading": the most plausible alternative reading (null for high).
- Use "read_confidence": "none" when the answer is blank/unreadable.

STEP 2 — For each problem, solve it yourself, carefully, step by step. Do not skip the solving.

STEP 3 — Judge and report. CRITICAL consistency rule: is_correct must be true IF AND ONLY IF the student's answer matches your solved correct_answer. Before outputting each problem, verify: does my is_correct flag agree with my own correct_answer vs student_answer comparison?

For each problem output:
1. "question": problem text as printed
2. "student_answer": student's handwritten answer (null if blank)
3. "read_confidence": "high" | "medium" | "low" | "none"
4. "alt_reading": most plausible alternative reading if confidence is low/medium, else null
5. "is_correct": boolean per the rule above
6. "correct_answer": your solved answer
7. "concepts": 1-3 short labels for the math concepts involved
8. "error_type": if wrong, short label for the mistake pattern visible in the student's work; null if correct

Return ONLY a valid JSON object, no markdown fences, exactly this shape:
{"subject":"...","grade_level":"...","problems":[{"number":1,"question":"...","student_answer":"...","read_confidence":"high","alt_reading":null,"is_correct":false,"correct_answer":"...","concepts":["..."],"error_type":"..."}],"legibility_notes":"..."}`

export const DIAGNOSE_PROMPT = `You are the diagnostic engine of LearnTwin AI. Below are the problems a student got wrong, with what they wrote, the correct answer, and a short note on the visible mistake. Your job: identify the 1-4 UNDERLYING misconceptions (not surface errors).

Rules:
- Merge multiple wrong answers under the same root cause (if two errors both come from "adds numerators and denominators directly", that is ONE misconception with evidence from both problems).
- Use education-research-informed names (e.g. "Fraction Addition Misconception — cross-adding without common denominators").
- "explanation_student" must address the student directly ("You added the numerators..."), 2 sentences max, no jargon.
- "explanation_parent" must be precise and technical, 2 sentences max.
- Assign confidence 0-1 based on how clearly the evidence supports the diagnosis.
- severity: high (foundational concept, blocks future topics) / medium (procedural slip, recurring) / low (careless, isolated).
- topic_tree: 2-3 levels from broad to narrow, lowercase snake_case, no spaces (e.g. ["fractions","operations","addition_subtraction"]).

Return ONLY valid JSON, no markdown fences, exactly this shape:
{"misconceptions":[{"id":"m1","name":"...","explanation_student":"...","explanation_parent":"...","evidence_problems":[1,2],"confidence":0.9,"severity":"high","topic_tree":["...","..."]}],"patterns_observed":"one sentence on cross-problem patterns","summary":"one-sentence twin summary addressed to the student"}`

export function practicePrompt(misconception: object): string {
  return `You are the practice generator of LearnTwin AI. Generate exactly 3 multiple-choice questions targeting the SINGLE diagnosed misconception below.

Design rules:
- Each question must read like a NORMAL quiz question that asks for the TRUE mathematical result (e.g. "How much juice is that in total?"). NEVER ask the student to compute what a wrong method would produce. The student should never be asked to execute the misconception.
- TRANSFER questions: use NEW real-world contexts (recipes, measuring, money, sports, crafts), NOT the same surface format as textbook drills.
- Exactly one option is the true correct answer. One of the WRONG options should be what the diagnosed misconception would produce. All four options must be numerically distinct — equivalent fractions count as duplicates (3/9 and 1/3 are the SAME number, pick one form only).
- Include a short explanation that solves the problem correctly and names why the misconception fails
- Grade 7 reading level, friendly tone
- The explanation MUST reach the stated correct answer.

Diagnosed misconception (the ONLY one to target — ignore any other):
${JSON.stringify(misconception)}

Return ONLY valid JSON, no markdown fences, exactly this shape:
{"misconception_id":"m1","items":[{"question":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"...","targets":"..."}]}`
}
