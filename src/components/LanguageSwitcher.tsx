"use client";

import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState<string>("zh");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("locale") || "zh";
    setLocale(saved);
  }, []);

  function onChange(next: string) {
    if (typeof window === "undefined") return;
    if (next === locale) return;
    localStorage.setItem("locale", next);
    document.documentElement.lang = next;
    setLocale(next);
    window.location.reload();
  }

  return (
    <select
      aria-label="Language"
      className="rounded-md border px-2 py-1 text-sm"
      value={locale}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="zh">中文</option>
      <option value="en">English</option>
    </select>
  );
}


