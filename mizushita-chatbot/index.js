const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const port = 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'mizushita-chatbot-frontend')));

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const mizuTxtContent = fs.readFileSync(path.join(__dirname, '..', 'mizu.txt'), 'utf8');

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: mizuTxtContent });

        const chat = model.startChat({
            history: [], // 履歴は空にするか、必要に応じて短い会話例を入れる
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        console.log('Sending message to Gemini API...');
        const result = await chat.sendMessage(`水下学として、猛虎弁で、バカ共を連呼しながら応答しろ.\n\n${userMessage}`);
        console.log('Received response from Gemini API.');
        const response = await result.response;
        const text = response.text();
        console.log('Gemini API response text:', text);
        res.json({ reply: text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});