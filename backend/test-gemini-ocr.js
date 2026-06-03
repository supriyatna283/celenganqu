require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    console.log("Key:", process.env.GEMINI_API_KEY.substring(0, 5) + "...");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello, what model are you?',
    });
    console.log("Success:", response.text);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
