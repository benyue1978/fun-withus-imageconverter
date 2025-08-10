"use client";

import { useEffect, useMemo, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import zh from "@/i18n/messages/zh.json";
import en from "@/i18n/messages/en.json";

type Messages = Record<string, string>;

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<string>("zh");
  const [messages, setMessages] = useState<Messages | null>(zh as unknown as Messages);

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("locale")) || "zh";
    setLocale(saved);
    setMessages((saved === "en" ? (en as unknown as Messages) : (zh as unknown as Messages)));
    if (typeof document !== "undefined") document.documentElement.lang = saved;
  }, []);

  const value = useMemo(() => ({ locale, messages }), [locale, messages]);

  if (!value.messages) return <>{children}</>;

  return (
    <NextIntlClientProvider locale={value.locale} messages={value.messages} timeZone="Asia/Shanghai">
      {children}
    </NextIntlClientProvider>
  );
}


