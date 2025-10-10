import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { minioClient, BUCKET } from "@/lib/minio";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 生成唯一文件名
    const fileId = uuidv4();
    const fileName = `${fileId}-${file.name}`;
    
    // 将文件转换为Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 上传到MinIO
    await minioClient.putObject(BUCKET, fileName, buffer, buffer.length, {
      'Content-Type': file.type,
    });

    // 保存文件信息到数据库
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO files (id, name, original_name, size, type, bucket, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
        [fileId, fileName, file.name, file.size, file.type, BUCKET]
      );

      return NextResponse.json({
        success: true,
        file: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
