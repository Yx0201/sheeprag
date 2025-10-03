import type { Metadata } from "next";
import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Layout from "@/app/(web)/components/Layout/page";

export const metadata: Metadata = {
  title: "sheep_rag",
  description: "ai rag",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <Layout>{children}</Layout>
        </AntdRegistry>
      </body>
    </html>
  );
}
