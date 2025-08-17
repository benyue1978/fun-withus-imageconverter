"use client";

import React from "react";
import { useTranslations } from "next-intl";

export default function FeedbackButton() {
  const t = useTranslations();
  return (
    <button
      data-tally-open="nWWoAL"
      data-tally-hide-title="1"
      data-tally-auto-close="0"
      className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center gap-2"
      title={t("feedback")}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <path
          d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-sm">{t("feedback")}</span>
    </button>
  );
}
