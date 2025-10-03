// stroe/chat.ts

import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content?: string;
  thinking: string;
  answer: string;
  streaming?: boolean;
  timestamp?: number;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentAiMessageId: string | null;
}

interface UpdatePayload {
  thinkingChunk?: string;
  answerChunk?: string;
  done: boolean;
}

interface ChatActions {
  addUserMessage: (content: string) => void;
  sendMessageToAI: (content: string) => Promise<void>;
  updateAIMessage: (payload: UpdatePayload) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

type ChatStore = ChatState & ChatActions;





const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  currentAiMessageId: null,

  addUserMessage: (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      thinking: '',
      answer: '',
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, userMessage] }));
  },

  // [核心修改] 更新 sendMessageToAI 以精确处理信号
  sendMessageToAI: async (content: string) => {
    const { addUserMessage, setLoading } = get();
    addUserMessage(content);
    setLoading(true);

    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'ai',
      thinking: '',
      answer: '',
      streaming: true,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, aiMessage],
      currentAiMessageId: aiMessageId,
    }));

    let parsingState: 'thinking' | 'answer' = 'thinking';

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          get().updateAIMessage({ done: true });
          break;
        }

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const chunkContent = data.content || '';

              if (data.done) {
                get().updateAIMessage({ done: true });
                return; // 明确结束
              }

              // --- 精确的信号判断逻辑 ---
              // 1. 检查是否是思考开始信号
              if (chunkContent === '<think>') {
                parsingState = 'thinking';
                continue; // 消耗掉这个信号，不渲染
              }

              // 2. 检查是否是思考结束信号
              if (chunkContent === '</think>') {
                parsingState = 'answer';
                continue; // 消耗掉这个信号，不渲染
              }
              
              // 3. 根据当前状态分发内容
              if (parsingState === 'thinking') {
                get().updateAIMessage({ thinkingChunk: chunkContent, done: false });
              } else { // parsingState === 'answer'
                get().updateAIMessage({ answerChunk: chunkContent, done: false });
              }

            } catch (e) {
              console.log("解析流式数据错误:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("发送消息错误:", error);
      get().updateAIMessage({ answerChunk: "发送消息失败", done: true });
    }
  },

  updateAIMessage: (payload: { thinkingChunk?: string; answerChunk?: string; done: boolean; }) => {
    set((state) => {
      const { currentAiMessageId } = state;
      if (!currentAiMessageId) return state;
      const updatedMessages = state.messages.map(msg => {
        if (msg.id === currentAiMessageId) {
          return {
            ...msg,
            thinking: msg.thinking + (payload.thinkingChunk || ''),
            answer: msg.answer + (payload.answerChunk || ''),
            streaming: !payload.done,
          };
        }
        return msg;
      });
      return {
        messages: updatedMessages,
        isLoading: payload.done ? false : state.isLoading,
        currentAiMessageId: payload.done ? null : currentAiMessageId,
      };
    });
  },

  // ... clearMessages 和 setLoading 函数保持不变 ...
  clearMessages: () => {
    set({ messages: [], isLoading: false, currentAiMessageId: null });
  },
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

export default useChatStore;