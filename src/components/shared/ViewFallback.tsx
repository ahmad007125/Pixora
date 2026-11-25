export function ViewFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="flex items-center gap-3 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4285F4] border-t-transparent" />
        <span>Loading studio workspace…</span>
      </div>
    </div>
  );
}
