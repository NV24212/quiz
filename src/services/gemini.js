export const parseQuestionsWithAI = async (rawText) => {
  const workerUrl = 'https://ai.azhar.store';

  const prompt = `
Analyze the following raw text from a quiz and extract all questions.

CRITICAL RULES:
1. For True/False questions, use the type "true_false" and options ["صواب", "خطأ"].
2. IF THE CORRECT ANSWER IS NOT EXPLICITLY PROVIDED IN THE TEXT, YOU MUST SOLVE THE QUESTION YOURSELF AND PROVIDE THE CORRECT ANSWER based on your knowledge.
3. For "text" type questions, provide the most likely correct short answer or keyword.
4. For "matching" type questions:
   - The "text" should be the overall instruction (e.g. "Match the following").
   - The "options" should be an array of strings in the format "Prompt:CorrectAnswer".
   - The "correct_answer" should be a summary of the count (e.g. "6 matches").
5. REMOVE ABSOLUTE DUPLICATED QUESTIONS. If the text has the same question multiple times, extract it only once.
6. Preserve the language (Arabic/English).
7. Return ONLY valid JSON in this format:
[
  {
    "text": "question text",
    "type": "multiple_choice|text|true_false|matching",
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