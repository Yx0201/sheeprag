"use client";

import React, { useState } from "react";
import "./globals.scss";
import { Layout, Menu, ConfigProvider } from "antd";
import styles from "./layout.module.scss";
import IconFont from "@/app/(web)/components/IconFont";
import { ANTD_TOKEN, SYS_OPTIONS } from "@/app/(web)/constant/resource";
import { MENU_LIST } from "@/app/(web)/constant/menu";
import { useRouter } from "next/navigation";

const { Content, Sider } = Layout;

const App = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [collapseType, setCollapseType] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const router = useRouter();

  const menuClick = (props: { key: string; keyPath: string[] }) => {
    const { key, keyPath } = props;
    setSelectedKeys([key]);
    keyPath.length && router.push(keyPath[0]);
  };

  return (
    <ConfigProvider theme={ANTD_TOKEN}>
      <Layout hasSider className={styles.layoutRoot}>
        <Sider
          collapsedWidth={50}
          collapsible
          theme="light"
          className={styles.layoutSider}
          onCollapse={(v) => setCollapseType(v)}
        >
          <div
            className={styles.sysicon}
            onClick={() => {
              router.push("/");
              setSelectedKeys([]);
            }}
          >
            <IconFont style={{ fontSize: 20 }} type={SYS_OPTIONS.SYS_ICON} />
            {!collapseType && <span>{SYS_OPTIONS.SYS_NAME}</span>}
          </div>
          <Menu
            style={{ border: "none" }}
            mode="inline"
            selectedKeys={selectedKeys}
            items={MENU_LIST}
            onClick={menuClick}
          />
        </Sider>
        <Layout>
          <Content className={styles.layoutContent}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
