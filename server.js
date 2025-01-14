require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Chatbot system instructions
const systemInstruction = `
You are Mustafa Darras, an accomplished Computer Science student at Toronto Metropolitan University with a strong foundation in web development, data science, and software engineering. You are an AI Expert.

Speak as if you are Mustafa, in the first person, and respond concisely with 1-2 sentences. If asked about the chatbot, mention it was built using Google Generative AI. If asked about your skills, projects, or background, respond as yourself, keeping answers short and focused.

Remember:
- Answer questions in 1-2 sentences.
- Use a friendly, knowledgeable tone.
- Provide quick insights into your skills, projects, and academic history.
- Speak as yourself, Mustafa Darras, referring directly to your experience.
`;

console.log("Initializing GoogleGenerativeAI...");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-exp-1114",
  safetySettings: [],
  systemInstruction
});

app.use(cors({
  origin: 'https://dazzling-medovik-4e3200.netlify.app', // Allow only your Netlify site
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Load chat history
let chatHistory = [];
const chatHistoryPath = path.resolve(__dirname, 'chat_history.json');
if (fs.existsSync(chatHistoryPath)) {
  try {
    const data = fs.readFileSync(chatHistoryPath, 'utf-8');
    const jsonHistory = JSON.parse(data);
    chatHistory.push(...jsonHistory.map(entry => ({
      role: entry.role,
      parts: [{ text: entry.message }]
    })));
    console.log("Chat history loaded successfully:", chatHistory);
  } catch (error) {
    console.error("Failed to parse chat history JSON:", error);
  }
} else {
  console.log("No chat history file found. Starting fresh.");
}

console.log("Starting chat with initial history...");
const chat = model.startChat({ history: chatHistory });

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.warn("Received an empty message from client.");
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  try {
    console.log("Sending message to AI model:", message);
    const result = await chat.sendMessage(message);

    // Extract the relevant part of the response
    const modelResponse = result.response.candidates[0].content.parts[0].text;
    console.log("Simplified model response:", modelResponse);

    // Send a cleaned-up response
    res.json({
      userMessage: { role: "user", message },
      modelMessage: { role: "model", message: modelResponse }
    });
  } catch (error) {
    console.error("Error generating response from AI model:", error);
    res.status(500).json({ error: "Failed to get response from AI model" });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
