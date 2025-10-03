"use client";

import { useState } from "react";
import { Button, Input } from "antd";
import styles from "./index.module.scss";
import IconFont from "@/app/(web)/components/IconFont";
import useChatStore from "@/stroe/chat";

const InputArea = () => {
  const [value, setValue] = useState("");
  const { sendMessageToAI, isLoading } = useChatStore();

  const chatSend = async () => {
    if (!value.trim()) return;
    
    const message = value.trim();
    setValue(""); // 清空输入框
    
    // 调用store方法发送消息给AI
    await sendMessageToAI(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatSend();
    }
  };

  return (
    <div className={styles.inputBox}>
      <Input.TextArea
        className={styles.textarea}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="输入你的问题..."
        disabled={isLoading}
      />
      <div className={styles.inputOptions}>
        <Button
          className={styles.sendbtn}
          icon={<IconFont type="icon-send" />}
          disabled={!value.trim() || isLoading}
          onClick={chatSend}
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export default InputArea;