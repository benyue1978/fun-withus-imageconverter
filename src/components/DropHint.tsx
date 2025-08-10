"use client";

export default function DropHint({ onPick }: { onPick: () => void }) {
  return (
    <div className="relative grid place-items-center rounded-3xl border-2 border-dashed p-16 text-center bg-white/60">
      <div className="space-y-3">
        <p className="text-xl font-medium">拖拽图片到页面任意位置</p>
        <p className="text-sm text-gray-600">或</p>
        <button onClick={onPick} className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800">选择文件</button>
        <p className="text-xs text-gray-500 max-w-md mx-auto">支持 PNG / JPEG / WebP /（浏览器支持时）AVIF。所有处理在浏览器本地完成，不会上传到服务器。</p>
      </div>
    </div>
  );
}


