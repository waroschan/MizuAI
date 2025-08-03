document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

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
        messageElement.textContent = message;
        messageWrapper.appendChild(messageElement);
        chatBox.appendChild(messageWrapper);
        chatBox.scrollTop = chatBox.scrollHeight; // スクロールを一番下にする
    };

    appendMessage('ai', 'おう、ワイがAI水下や！何か質問あるんか？遠慮せんと聞いてこい！');

    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage('user', message);
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });
            const data = await response.json();
            appendMessage('ai', data.reply);
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
});
