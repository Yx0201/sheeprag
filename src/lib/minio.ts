// lib/minio.ts
import { Client } from "minio";

export const minioClient = new Client({
  endPoint: "127.0.0.1",  // MinIO 服务器地址
  port: 9000,             // MinIO API 端口 (默认是9000，9001是控制台端口)
  useSSL: false,
  accessKey: "minioadmin",
  secretKey: "minioadmin",
});

export const BUCKET = "sheep-file-io"; // 记得提前在 MinIO 里创建 bucket
