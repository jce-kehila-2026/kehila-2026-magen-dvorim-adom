import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("lang") || "he";
  });

  useEffect(() => {
  localStorage.setItem("lang", language);

  const path = window.location.pathname;

  // ✅ EXCLUDE these pages from global RTL/LTR override
  const excludedRoutes = ["/submit-case", "/feedback", "/"];

  const isExcluded = excludedRoutes.some((route) =>
    path.startsWith(route)
  );

  if (!isExcluded) {
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
  }
}, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}