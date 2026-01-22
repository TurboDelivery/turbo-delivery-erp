"use client"; // Important pour Next.js 14

import "react-perfect-scrollbar/dist/css/styles.css"; // CSS chargé côté client
import PerfectScrollbar from "react-perfect-scrollbar";
import { ReactNode } from "react";

interface ScrollbarWrapperProps {
  children: ReactNode;
}

export default function ScrollbarWrapper({ children }: ScrollbarWrapperProps) {
  return <PerfectScrollbar>{children}</PerfectScrollbar>;
}
