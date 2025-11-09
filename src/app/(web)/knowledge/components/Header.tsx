'use client'


import React from "react";
import { MYKNOWLEDGE } from "@/lib/ defines";

const Header: React.FC = () => {
  return (
    <div>
      <p className="fs-18 text-bold mb-10">{MYKNOWLEDGE.TITLE}</p>
      <p className="fs-14 text-secondary">{MYKNOWLEDGE.DESCRIPTION}</p>
    </div>
  );
};

export default Header;
