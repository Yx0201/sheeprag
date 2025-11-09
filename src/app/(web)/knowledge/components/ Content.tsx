"use client";

import React, { useState } from "react";
import styles from "../index.module.scss";
import CardItem from "./CardItem";
import CreateCard from "./CreateCard";
import FormModal from "./ FormModal";

type Props = {};

const Content = (props: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateCardClick = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const data = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className={styles.container}>
      <div className={styles["inner-list"]}>
        <CreateCard onClick={handleCreateCardClick} />
        {data.map((item) => {
          return <CardItem key={item} />;
        })}

        {/* <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem /> */}
      </div>
      <FormModal
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        handleCancel={handleCancel}
      />
    </div>
  );
};

export default Content;
