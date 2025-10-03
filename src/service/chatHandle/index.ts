// service/chatHandle.ts

export const chatStreamHandle = async function* (content: string) {
  try {
    // 直接请求真实 AI 模型
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3:0.6b",
        messages: [{ role: "user", content }],
        stream: true,
      }),
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.trim().split("\n");

      for (const line of lines) {
        if (line.trim() === "") continue;
        try {
          const json = JSON.parse(line);
          
          // 直接将模型返回的 content 和 done 状态 yield 出去
          // 这其中就会自然包含 <think>, </think> 作为 content 的情况
          if (json.message) {
            yield {
              content: json.message.content,
              done: json.done,
              timestamp: Date.now(),
            };
          }

          // 如果模型报告已完成，则退出循环
          if (json.done) {
            return;
          }

        } catch (e) {
          console.log("解析JSON错误:", e);
        }
      }
    }
  } catch (error) {
    console.error("流式请求错误:", error);
    yield {
      content: "请求失败",
      done: true,
      error: true,
      timestamp: Date.now(),
    };
  }
};