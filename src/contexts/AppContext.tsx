import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewMode } from '@/types';
import { useOrganizations, DbOrganization } from '@/hooks/useOrganizations';
import { useProducts, DbProduct } from '@/hooks/useProducts';
import { useUserProfile, UserProfile } from '@/hooks/useUserProfile';

interface AppContextType {
  organizations: DbOrganization[];
  organizationsLoading: boolean;
  currentOrganization: DbOrganization | null;
  setCurrentOrganization: (org: DbOrganization) => void;
  products: DbProduct[];
  productsLoading: boolean;
  currentProduct: DbProduct | null;
  setCurrentProduct: (product: DbProduct) => void;
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  // ProdBod additions
  currentOrgId: string | null;
  setCurrentOrgId: (id: string | null) => void;
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<DbOrganization | null>(null);
  const [currentProduct, setCurrentProduct] = useState<DbProduct | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rest-dark-mode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { data: organizations = [], isLoading: organizationsLoading } = useOrganizations();
  const { data: products = [], isLoading: productsLoading } = useProducts(currentOrganization?.id);
  const { data: userProfile = null, isLoading: userProfileLoading } = useUserProfile();

  // Auto-select first organization
  useEffect(() => {
    if (!currentOrganization && organizations.length > 0) {
      setCurrentOrganization(organizations[0]);
    }
  }, [organizations, currentOrganization]);

  // Sync currentOrgId with currentOrganization for ProdBod pages
  useEffect(() => {
    if (currentOrganization && !currentOrgId) {
      setCurrentOrgId(currentOrganization.id);
    }
  }, [currentOrganization]);

  // Auto-select first product when org changes
  useEffect(() => {
    if (products.length > 0) {
      const stillExists = currentProduct && products.find(p => p.id === currentProduct.id);
      if (!stillExists) {
        setCurrentProduct(products[0]);
      }
    } else {
      setCurrentProduct(null);
    }
  }, [products]);

  // Persist and apply dark mode
  useEffect(() => {
    localStorage.setItem('rest-dark-mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev: boolean) => !prev);
  const toggleSidebar = () => setIsSidebarCollapsed((prev: boolean) => !prev);

  return (
    <AppContext.Provider
      value={{
        organizations,
        organizationsLoading,
        currentOrganization,
        setCurrentOrganization,
        products,
        productsLoading,
        currentProduct,
        setCurrentProduct,
        currentView,
        setCurrentView,
        isDarkMode,
        toggleDarkMode,
        isSidebarCollapsed,
        toggleSidebar,
        currentOrgId,
        setCurrentOrgId,
        userProfile,
        userProfileLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
