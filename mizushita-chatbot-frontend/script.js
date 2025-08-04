document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const toggleSearchButton = document.getElementById('toggle-search-button');

    let conversationHistory = []; // 会話履歴をブラウザ側で保持
    let searchMode = false; // 検索モードの初期状態をOFFに

    // 検索モードの表示を更新する関数
    const updateSearchModeDisplay = () => {
        toggleSearchButton.textContent = `検索モード: ${searchMode ? 'ON' : 'OFF'}`;
        toggleSearchButton.style.backgroundColor = searchMode ? '#764ba2' : '#ccc';
    };

    // 初期表示
    updateSearchModeDisplay();

    const appendMessage = (sender, message) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message-wrapper');

        if (sender === 'ai') {
            const avatar = document.createElement('img');
            avatar.src = 'AI水下学.jpg';
            avatar.classList.add('ai-avatar');
            messageWrapper.appendChild(avatar);
        }

        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.innerHTML = message.replace(/\n/g, '<br>');
        messageWrapper.appendChild(messageElement);
        chatBox.appendChild(messageWrapper);
        chatBox.scrollTop = chatBox.scrollHeight; // スクロールを一番下にする
    };

    appendMessage('ai', 'おう、ワイがAI水下や！何か質問あるんか？遠慮せんと聞いてこい！');

    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage('user', message);
        conversationHistory.push({ role: 'user', content: message }); // ユーザーメッセージを履歴に追加
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message, history: conversationHistory, searchMode: searchMode }), // 履歴と検索モードも一緒に送信
            });
            const data = await response.json();
            appendMessage('ai', data.reply);
            conversationHistory.push({ role: 'assistant', content: data.reply }); // AIの返信を履歴に追加
        } catch (error) {
            console.error('Error sending message:', error);
            appendMessage('ai', 'エラーが発生したで。もう一回試してみてくれや。');
        }
    };

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // 検索モード切り替えボタンのイベントリスナー
    toggleSearchButton.addEventListener('click', () => {
        searchMode = !searchMode; // 検索モードを反転
        updateSearchModeDisplay(); // 表示を更新
    });
});
