"use client";

import { ReactNode } from "react";

import { StoreSettingsProvider } from "@/app/context/StoreSettingsContext";

export default function StoreSettingsProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <StoreSettingsProvider>
      {children}
    </StoreSettingsProvider>
  );
}
