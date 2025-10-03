"use client";

import InputArea from "./components/InputArea";
import MsgArea from "./components/MsgArea";
import styles from "./page.module.scss";

const ChatMessage = () => {
  return (
    <div className={styles.msgpage}>
      <div className={styles.msgArea}>
        <MsgArea />
      </div>
      <div className={styles.inputArea}>
        <InputArea />
      </div>
    </div>
  );
};

export default ChatMessage;