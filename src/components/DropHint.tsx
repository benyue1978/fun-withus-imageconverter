"use client";
import { useTranslations } from "next-intl";

export default function DropHint({ onPick }: { onPick: () => void }) {
  const t = useTranslations();
  return (
    <div className="relative grid place-items-center rounded-3xl border-2 border-dashed p-16 text-center bg-white/60">
      <div className="space-y-3">
        <p className="text-xl font-medium">{t("drop.hint")}</p>
        <p className="text-sm text-gray-600">{t("or")}</p>
        <button onClick={onPick} className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800">{t("choose")}</button>
        <p className="text-xs text-gray-500 max-w-md mx-auto">{t("drop.note")}</p>
      </div>
    </div>
  );
}


