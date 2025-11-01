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

    // 3. 调用 Ollama API 生成向量嵌入
    console.log("开始调用 Ollama API 生成向量...");
    const ollamaResponse = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: content, // 将整个文件内容作为 prompt 发送给向量模型
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

    // 4. 连接数据库并插入数据
    console.log("开始连接数据库并插入数据...");
    const client = new Client(dbConfig);
    await client.connect();

    const insertQuery = `
      INSERT INTO knowledge_base (filename, original_name, file_type, file_size, content, embedding)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const insertValues = [
      file.name, // filename
      file.name, // original_name (这里与 filename 相同)
      file.type, // file_type
      buffer.length, // file_size
      content,   // content
      `[${embedding.join(',')}]` // embedding (转换为 pgvector 接受的格式)
    ];

    await client.query(insertQuery, insertValues);
    await client.end(); // 关闭连接

    console.log("文件信息和向量已成功插入数据库");

    // 5. 返回成功响应
    return Response.json({ message: '文件上传、向量化并入库成功！' });

  } catch (error) {
    console.error('处理上传请求时发生错误:', error);
    let errorMessage = '内部服务器错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}