"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface RoleContextType {
  role: string;
  isEmployee: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: "",
  isEmployee: false,
});

export function RoleProvider({
  role,
  children,
}: {
  role: string;
  children: ReactNode;
}) {
  const normalizedRole = (role || "").toLowerCase();
  const isEmployee = normalizedRole === "employee";

  return (
    <RoleContext.Provider value={{ role: normalizedRole, isEmployee }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useUserRole() {
  return useContext(RoleContext);
}
