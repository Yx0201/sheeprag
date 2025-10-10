"use client";

import { UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { Button, message, Upload } from "antd";

const Knowledge = () => {
  const fileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const fileRes = await fetch("/files", {
      method: "POST",
      body: formData,
    });

    if (fileRes.ok) {
      message.success("File uploaded successfully");
    } else {
      message.error("File upload failed");
    }

    return false;
  };

  const props: UploadProps = {
    name: "file",
    //   action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
    headers: {
      authorization: "authorization-text",
    },
    onChange(info) {
      console.log(info, "info");
    },
    beforeUpload: (file) => {
      fileUpload(file);

      return false;
    },
  };

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>Click to Upload</Button>
    </Upload>
  );
};

export default Knowledge;
