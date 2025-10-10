import { chatStreamHandle } from "@/service/chatHandle";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return new Response("消息内容不能为空", { status: 400 });
    }

    // 创建流式响应,
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 使用异步生成器获取流式数据
          for await (const chunk of chatStreamHandle(message)) {
            // 将每个数据块编码为SSE格式
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
            
            // 如果是最后一条消息，结束流
            if (chunk.done) {
              controller.close();
              break;
            }
          }
        } catch (error) {
          console.error("流式处理错误:", error);
          const errorData = `data: ${JSON.stringify({
            content: "处理请求时发生错误",
            done: true,
            error: true,
            timestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    // 返回流式响应
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("API错误:", error);
    return new Response("服务器内部错误", { status: 500 });
  }
}