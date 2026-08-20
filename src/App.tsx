import './index.css';
import { ChatArea } from './components/chat/ChatArea';
import { useChat } from './hooks/useChat';

function App() {
  const { messages, isLoading, sendMessage, stopActiveRequest } = useChat();

  return (
    <main className="app-shell">
      <section className="chat-device" aria-label="Trợ lý bất động sản">
        <header className="chat-header">
          <div className="brand-mark">V</div>
          <div>
            <h1>Trợ lý bất động sản</h1>
            <p><span /> Đang hoạt động</p>
          </div>
        </header>
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          sendMessage={sendMessage}
          onStop={stopActiveRequest}
        />
      </section>
    </main>
  );
}

export default App;

