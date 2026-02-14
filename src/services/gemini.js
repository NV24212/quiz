export const parseQuestionsWithAI = async (rawText) => {
  const workerUrl = 'https://ai.azhar.store';

  const prompt = `
Analyze the following raw text from a quiz and extract all questions. 

CRITICAL RULES:
1. QUESTION TYPES:
   - "multiple_choice": Single correct answer from options.
   - "multiple_answer": TWO OR MORE correct answers from options. If a question says "Select all that apply" or has multiple correct marks, use this type.
   - "true_false": Use options ["True", "False"].
   - "matching": 
     - "text" is the instruction.
     - "options" is an array of "Prompt:CorrectAnswer" strings.
     - "correct_answer" is a summary like "X matches".
   - "text": Short answer/keyword.

2. CORRECT ANSWERS:
   - IF THE CORRECT ANSWER IS NOT EXPLICITLY PROVIDED, YOU MUST SOLVE THE QUESTION BASED ON YOUR KNOWLEDGE.
   - For "multiple_answer", provide ALL correct answers separated by a comma (e.g., "Paris, Lyon").
   - For "multiple_choice", provide exactly one correct option.

3. CONTEXT & QUALITY:
   - Identify the language and maintain it (Arabic/English).
   - Clean up noise (headers, footers, page numbers).
   - REMOVE ABSOLUTE DUPLICATED QUESTIONS.
   - If the text is ambiguous, use your best judgment to determine the most likely question structure.

4. Return ONLY valid JSON in this format:
[
  {
    "text": "question text",
    "type": "multiple_choice|multiple_answer|text|true_false|matching",
    "options": ["option1", "option2"],
    "correct_answer": "correct answer"
  }
]

Raw Text:
${rawText}
  `;

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawText: prompt })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // If the worker returns {questions: [...]}
    if (data.questions) {
      return data.questions;
    }

    // If it returns the array directly
    return data;

  } catch (error) {
    console.error("AI Parsing Error Details:", error);

    if (error.message?.includes("Failed to fetch")) {
      throw new Error("Cannot connect to AI service. Please check your internet connection.");
    }

    throw new Error(error.message || "Failed to parse text with AI.");
  }
};