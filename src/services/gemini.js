import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

export const parseQuestionsWithAI = async (rawText) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            text: { type: SchemaType.STRING },
            type: { type: SchemaType.STRING, enum: ["multiple_choice", "text", "true_false"] },
            options: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "List of options for multiple choice questions. For true_false, use ['صواب', 'خطأ']. Null or empty for text questions."
            },
            correct_answer: { type: SchemaType.STRING }
          },
          required: ["text", "type", "correct_answer"]
        }
      }
    }
  });

  const prompt = `
        Analyze the following raw text from a quiz and extract all questions.
        
        CRITICAL RULES:
        1. For True/False questions, use the type "true_false" and options ["صواب", "خطأ"].
        2. IF THE CORRECT ANSWER IS NOT EXPLICITLY PROVIDED IN THE TEXT, YOU MUST SOLVE THE QUESTION YOURSELF AND PROVIDE THE CORRECT ANSWER based on your knowledge.
        3. For "text" type questions, provide the most likely correct short answer or keyword.
        4. Preserve the language (Arabic/English).
        
        Raw Text:
        ${rawText}
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Parsing Error Details:", error);

    if (error.message?.includes("404") || error.message?.includes("not found")) {
      throw new Error("Model not found. Please ensure your API key has access to 'gemini-1.5-flash' in Google AI Studio.");
    }

    if (error.message?.includes("429")) {
      throw new Error("AI Quota exceeded. Please wait a minute or check your plan.");
    }

    throw new Error(error.message || "Failed to parse text with AI.");
  }
};
