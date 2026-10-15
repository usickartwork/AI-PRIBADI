'use client';

import React, { createContext, useContext } from 'react';

export type FaithTabType = 'tanya' | 'bible' | 'games' | 'notes' | 'prayer' | 'profile';

export interface FaithNavContextType {
  activeTab: FaithTabType;
  setActiveTab: (tab: FaithTabType) => void;
  onTogglePanel?: () => void;
  onClose?: () => void;
  isDark?: boolean;
}

const FaithNavContext = createContext<FaithNavContextType>({
  activeTab: 'tanya',
  setActiveTab: () => {},
});

export function FaithNavProvider({
  value,
  children,
}: {
  value: FaithNavContextType;
  children: React.ReactNode;
}) {
  return (
    <FaithNavContext.Provider value={value}>
      {children}
    </FaithNavContext.Provider>
  );
}

export function useFaithNav() {
  return useContext(FaithNavContext);
}

