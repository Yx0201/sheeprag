// app/api/upload/route.ts
import { Client } from 'pg'; // PostgreSQL 客户端
import { NextRequest } from 'next/server'; // Next.js 请求类型
import { Readable } from 'stream'; // Node.js 内置流模块

// PostgreSQL 连接配置 (请根据你的实际情况修改)
const dbConfig = {
  host: 'localhost', // PostgreSQL 服务器地址
  port: 5432,        // PostgreSQL 端口
  database: 'rag_demo', // 你的数据库名
  user: 'bbimasheep', // 你的数据库用户名
  password: '',       // 你的数据库密码 (如果需要)
};

// Ollama API 配置
const OLLAMA_API_URL = 'http://localhost:11434/api/embeddings'; // Ollama 服务器地址
const EMBEDDING_MODEL = 'nomic-embed-text'; // 你指定的向量模型

// 将 Buffer 转换为可读流的辅助函数
function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null); // 标记流结束
  return readable;
}

// 文本分块函数
function splitTextIntoChunks(text: string, chunkSize: number = 300, overlap: number = 50): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    // 获取一个块
    let end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    
    // 如果不是最后一块且不是在文本末尾，尝试在句子边界分割
    if (end < text.length) {
      // 寻找最后一个句号、感叹号或问号作为分割点
      const lastPunctuation = Math.max(
        chunk.lastIndexOf('。'),
        chunk.lastIndexOf('！'),
        chunk.lastIndexOf('？'),
        chunk.lastIndexOf('.'),
        chunk.lastIndexOf('!'),
        chunk.lastIndexOf('?')
      );
      
      // 如果找到了标点符号，则在该处分割
      if (lastPunctuation > chunkSize * 0.8) {
        chunk = chunk.slice(0, lastPunctuation + 1);
        end = start + chunk.length;
      }
    }
    
    chunks.push(chunk);
    start = end - overlap; // 重叠部分
    
    // 如果剩余文本太短，则结束
    if (start + overlap >= text.length) {
      break;
    }
  }
  
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    console.log("开始处理文件上传 API 请求");

    // 1. 解析 multipart/form-data 请求体以获取文件
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error("错误：未找到上传的文件");
      return Response.json({ error: '未找到文件' }, { status: 400 });
    }

    if (file.type !== 'text/plain') {
      console.error(`错误：文件类型 ${file.type} 不支持，仅支持 .txt 文件`);
      return Response.json({ error: '仅支持上传 .txt 文件' }, { status: 400 });
    }

    // 2. 读取文件内容
    const bytes = await file.arrayBuffer(); // 获取文件的 ArrayBuffer
    const buffer = Buffer.from(bytes); // 转换为 Buffer
    const content = buffer.toString('utf-8'); // 假设文件内容是 UTF-8 编码的文本

    if (!content.trim()) {
      console.error("错误：上传的文件内容为空");
      return Response.json({ error: '文件内容不能为空' }, { status: 400 });
    }

    console.log(`文件读取成功，大小: ${buffer.length} bytes`);

    // 3. 将文件内容分块
    const chunks = splitTextIntoChunks(content, 300, 50);
    console.log(`文件已分割为 ${chunks.length} 个块`);

    // 4. 连接数据库
    console.log("开始连接数据库...");
    const client = new Client(dbConfig);
    await client.connect();

    // 5. 为每个块生成向量并存储
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // 跳过空块
      if (!chunk.trim()) continue;
      
      console.log(`处理第 ${i + 1}/${chunks.length} 个块...`);
      
      // 调用 Ollama API 生成向量嵌入
      console.log("开始调用 Ollama API 生成向量...");
      const ollamaResponse = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          prompt: chunk, // 将块内容作为 prompt 发送给向量模型
        }),
      });

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        console.error(`Ollama API 请求失败: ${ollamaResponse.status} ${errorText}`);
        return Response.json({ error: `Ollama API 错误: ${errorText}` }, { status: 500 });
      }

      const ollamaData = await ollamaResponse.json();
      const embedding = ollamaData.embedding; // Ollama API 返回的向量数组

      if (!embedding || !Array.isArray(embedding)) {
        console.error("错误：Ollama API 返回的向量格式不正确");
        return Response.json({ error: 'Ollama API 返回的向量数据无效' }, { status: 500 });
      }

      console.log(`向量生成成功，维度: ${embedding.length}`);

      // 插入数据到数据库
      const insertQuery = `
        INSERT INTO knowledge_base (filename, original_name, file_type, file_size, content, embedding, chunk_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      const insertValues = [
        `${file.name}_chunk_${i}`, // filename
        file.name, // original_name
        file.type, // file_type
        buffer.length, // file_size
        chunk,   // content (仅块内容)
        `[${embedding.join(',')}]`, // embedding (转换为 pgvector 接受的格式)
        i // chunk_index
      ];

      await client.query(insertQuery, insertValues);
    }
    
    await client.end(); // 关闭连接
    console.log("所有文件块信息和向量已成功插入数据库");

    // 6. 返回成功响应
    return Response.json({ message: `文件上传、分块、向量化并入库成功！共处理 ${chunks.length} 个块。` });

  } catch (error) {
    console.error('处理上传请求时发生错误:', error);
    let errorMessage = '内部服务器错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}