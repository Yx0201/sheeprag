// index.tsx

"use client";
import { Avatar } from "antd";
import styles from "./index.module.scss";
import { UserOutlined } from "@ant-design/icons";
import IconFont from "@/app/(web)/components/IconFont";
import { useEffect, useRef, useState } from "react";
import useChatStore, { Message } from "@/stroe/chat";
import MarkdownRender from "@/app/(web)/components/MarkdownRender";

// 这是一个用于渲染思考过程的简单组件，您可以自定义样式
const ThinkingComponent = ({ content }: { content: string }) => {
  if (!content) return null;
  return (
    <div className={styles.thinkingBox}>
      <details open>
        <summary>思考中...</summary>
        <MarkdownRender content={content} />
      </details>
    </div>
  );
};


const MsgArea = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages } = useChatStore();

  // 自动滚动到最新消息 (无变化)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.msgBox}>
      {messages.length ? (
        <>
          {messages.map((item: Message) => {
            // 1. [修改] 更新过滤逻辑
            const isUserMessageEmpty = item.role === 'user' && !item.content;
            const isAiMessageEmpty = item.role === 'ai' && !item.thinking && !item.answer;
            if (isUserMessageEmpty || isAiMessageEmpty) {
              return null;
            }

            return (
              <div
                key={item.id}
                className={`${styles.bubble} ${
                  item.role === "user" ? styles.bubbleUser : styles.bubbleAI
                }`}
              >
                {item.role === "user" ? (
                  <Avatar icon={<UserOutlined />} />
                ) : (
                  <Avatar icon={<IconFont type="icon-sheep-f" />} />
                )}
                <div className={styles.msgContent}>
                  {/* 2. [核心修改] 分区渲染思考和回答 */}
                  {item.role === "ai" ? (
                    <>
                      {/* 仅在有思考内容时渲染思考组件 */}
                      <ThinkingComponent content={item.thinking} />
                      {/* 渲染正式回答 */}
                      <MarkdownRender content={item.answer} />
                    </>
                  ) : (
                    // 渲染用户消息
                    <MarkdownRender content={item.content || ''} />
                  )}

                  {/* 3. [修改] 将光标附加到正式回答后面 */}
                  {item.streaming && <span className={styles.cursor}>▊</span>}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </>
      ) : (
        <div className={styles.hellotext}>HELLO! 输入内容,开始提问~</div>
      )}
    </div>
  );
};

export default MsgArea;