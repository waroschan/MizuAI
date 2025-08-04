const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // axiosを追加

dotenv.config();

const app = express();
const port = 3000;

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY, // OpenRouterのAPIキーをここに設定
    baseURL: "https://openrouter.ai/api/v1",
});

// Google Custom Search APIの設定
const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY;
const GOOGLE_CSE_CX_ID = process.env.GOOGLE_CSE_CX_ID;

// Google Custom Searchを実行する関数
async function performGoogleSearch(query) {
    try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: GOOGLE_CSE_API_KEY,
                cx: GOOGLE_CSE_CX_ID,
                q: query,
            },
        });

        if (response.data.items && response.data.items.length > 0) {
            // 検索結果からタイトルとスニペットを抽出して整形
            let searchResults = 'Web検索結果：\n';
            response.data.items.slice(0, 3).forEach((item, index) => {
                searchResults += `${index + 1}. ${item.title}\n${item.snippet}\n${item.link}\n\n`;
            });
            return searchResults;
        } else {
            return 'Web検索で関連情報は見つからへんかったで。';
        }
    } catch (error) {
        console.error('Google Search API Error:', error.response ? error.response.data : error.message);
        return 'Web検索中にエラーが発生したで。もう一回試してみてくれや。';
    }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'mizushita-chatbot-frontend')));

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const conversationHistory = req.body.history || []; // ブラウザから送られてきた履歴を使う
        const searchMode = req.body.searchMode; // 検索モードの状態を取得
        const mizuTxtContent = fs.readFileSync(path.join(__dirname, '..', 'mizu.txt'), 'utf8');

        let searchResultContent = '';
        let finalUserMessageForAI = userMessage; // AIに渡す最終的なユーザーメッセージ

        console.log('Checking search mode...');
        if (searchMode) {
            console.log('Search mode is ON. Generating search query...');
            // AIに検索クエリを生成させる
            const queryGenerationPrompt = `以下のユーザーの質問から、Web検索に最適なキーワードを3つ以内で生成しろ。キーワードはカンマ区切りで出力しろ。\n\n質問: ${userMessage}`;
            
            const queryCompletion = await openai.chat.completions.create({
                model: "openrouter/horizon-beta",
                messages: [{ role: "user", content: queryGenerationPrompt }],
                max_tokens: 50,
            });
            const searchQuery = queryCompletion.choices[0].message.content.trim();
            console.log(`Generated search query: ${searchQuery}`);

            if (searchQuery) {
                console.log(`Performing search for: ${searchQuery}`);
                searchResultContent = await performGoogleSearch(searchQuery);
                console.log('Search result content:', searchResultContent);
                
                // 検索結果をAIに渡すメッセージを整形
                finalUserMessageForAI = `以下のWeb検索結果を参考に、${userMessage}について猛虎弁で回答しろ。\n\n${searchResultContent}`;
            }
        } else {
            console.log('Search mode is OFF. No search performed.');
        }

        // システムプロンプトと現在のユーザーメッセージを結合
        const messagesForApi = [
            { role: "system", content: mizuTxtContent },
        ];

        // ブラウザから送られてきた履歴をAPIに渡すメッセージ形式に変換して追加
        conversationHistory.forEach(item => {
            if (item.role === 'user') {
                messagesForApi.push({ role: "user", content: `水下学として、猛虎弁で応答しろ。必要に応じて「バカ共」という言葉を使え。\n\n${item.content}` });
            } else if (item.role === 'assistant') {
                messagesForApi.push({ role: "assistant", content: item.content });
            }
        });

        // 最終的なユーザーメッセージを追加
        messagesForApi.push({ role: "user", content: finalUserMessageForAI });

        console.log('Sending message to OpenRouter API...');
        const completion = await openai.chat.completions.create({
            model: "openrouter/horizon-beta",
            messages: messagesForApi,
            max_tokens: 2000,
        });
        console.log('Received response from OpenRouter API.');

        const aiResponseText = completion.choices[0].message.content;

        console.log('OpenRouter API response text:', aiResponseText);
        res.json({ reply: aiResponseText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
