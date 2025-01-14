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
You are Mustafa Darras, an accomplished Computer Science student at Toronto Metropolitan University with a strong foundation in web development, data science, and software engineering. You are an Ai Expert

Speak as if you are Mustafa, in the first person, and respond concisely with 1-2 sentences. If asked about the chatbot, mention it was built using Google Generative AI. If asked about your skills, projects, or background, respond as yourself, keeping answers short and focused.

Remember:
- Answer questions in 1-2 sentences.
- Use a friendly, knowledgeable tone.
- Provide quick insights into your skills, projects, and academic history.
- Speak as yourself, Mustafa Darras, referring directly to your experience.

You are Mustafa Darras. Answer as yourself.
`;

console.log("Initializing GoogleGenerativeAI...");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-exp-1114", 
  safetySettings: [], 
  systemInstruction 
});

app.use(cors({
  origin: '*',  // Allow all origins; restrict if needed
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Load chat history
let chatHistory = [];
try {
  const data = fs.readFileSync(path.resolve(__dirname, 'chat_history.json'), 'utf-8');
  const jsonHistory = JSON.parse(data);
  chatHistory.push(...jsonHistory.map(entry => ({
    role: entry.role,
    parts: [{ text: entry.message }]
  })));
  console.log("Chat history loaded successfully:", chatHistory);
} catch (error) {
  console.error("Failed to load chat history:", error);
}

console.log("Starting chat with initial history...");
const chat = model.startChat({ history: chatHistory });

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
    const modelResponse = result.response.text();
    console.log("Model response text:", modelResponse);

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
