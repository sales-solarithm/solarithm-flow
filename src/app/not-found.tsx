export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">404</h1>
      <p className="text-zinc-400 mb-4">Page Not Found</p>
      <a
        href="/"
        className="px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#c49f30] transition-colors"
      >
        Return to Overview
      </a>
    </div>
  );
}
