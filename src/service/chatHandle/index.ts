// service/chatHandle.ts
import { Client } from "pg";

// PostgreSQL 连接配置 (请根据你的实际情况修改)
const dbConfig = {
  host: "localhost", // PostgreSQL 服务器地址
  port: 5432, // PostgreSQL 端口
  database: "rag_demo", // 你的数据库名
  user: "bbimasheep", // 你的数据库用户名
  password: "", // 你的数据库密码 (如果需要)
};

// Ollama API 配置
const OLLAMA_EMBEDDING_API_URL = "http://localhost:11434/api/embeddings";
const OLLAMA_CHAT_API_URL = "http://localhost:11434/api/chat";
const EMBEDDING_MODEL = "nomic-embed-text";
const CHAT_MODEL = "qwen3:0.6b";

// 生成文本向量的函数
async function generateEmbedding(text: string) {
  const response = await fetch(OLLAMA_EMBEDDING_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding;
}

// 在知识库中搜索相似内容的函数
async function searchSimilarContent(queryEmbedding: number[]) {
  const client = new Client(dbConfig);
  await client.connect();

  try {
    // 使用pgvector的cosine距离操作符进行相似性搜索
    // 限制返回最相似的3条记录
    const searchQuery = `
      SELECT content, filename, original_name, chunk_index
      FROM knowledge_base
      ORDER BY embedding <=> $1
      LIMIT 3
    `;

    const result = await client.query(searchQuery, [
      `[${queryEmbedding.join(",")}]`,
    ]);
    return result.rows;
  } finally {
    await client.end();
  }
}

export const chatStreamHandle = async function* (content: string) {
  try {
    // 1. 生成用户问题的向量
    const queryEmbedding = await generateEmbedding(content);

    // 2. 在知识库中搜索相似内容
    const similarContents = await searchSimilarContent(queryEmbedding);
    console.log(similarContents, "similarContents");

    // 3. 构建增强的提示词
    let enhancedPrompt = content;
    if (similarContents.length > 0) {
      enhancedPrompt = `基于以下知识库内容回答问题：\n\n${similarContents
        .map((item, index) => `文档 ${item.filename}:\n${item.content}`)
        .join("\n\n---\n\n")}\n\n问题：${content}`;
    }

    // 直接请求真实 AI 模型
    const response = await fetch(OLLAMA_CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [{ role: "user", content: enhancedPrompt }],
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
