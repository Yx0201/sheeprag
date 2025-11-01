// app/upload/page.tsx
"use client"; // 标记为客户端组件，因为需要处理文件上传

import { useState } from "react";
import styles from "./upload.module.scss"; // 引入 SCSS 模块

export default function FileUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null); // 清除之前的消息
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: "error", text: "请选择一个文件。" });
      return;
    }

    // 检查文件类型（可选，但推荐）
    if (file.type !== "text/plain") {
      setMessage({ type: "error", text: "只允许上传 .txt 文件。" });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setMessage(null);

    try {
      const res = await fetch("/upload", {
        // 假设你有一个 API 路由处理上传
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setMessage({
          type: "success",
          text: result.message || "文件上传并处理成功！",
        });
        setFile(null); // 清空已上传的文件
      } else {
        const errorData = await res.json();
        setMessage({ type: "error", text: errorData.error || "上传失败。" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "发生网络错误，请重试。" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>上传知识库文件</h1>
      <p className={styles.description}>
        请选择一个 .txt 文件进行上传和向量化处理。
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="fileInput" className={styles.label}>
            选择 TXT 文件
          </label>
          <input
            id="fileInput"
            type="file"
            accept=".txt" // 限制只选择 .txt 文件
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          {file && (
            <span className={styles.fileName}>
              已选择: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isUploading || !file}
          className={`${styles.button} ${
            isUploading ? styles.buttonDisabled : ""
          }`}
        >
          {isUploading ? "上传中..." : "上传并处理"}
        </button>
      </form>

      {message && (
        <div
          className={`${styles.message} ${styles[`message--${message.type}`]}`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
