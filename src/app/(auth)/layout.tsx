export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-e3-600 mb-4">
            <span className="text-white font-bold text-lg">E3</span>
          </div>
          <p className="text-slate-400 text-sm mt-2">AI Operating Partner</p>
        </div>
        {children}
      </div>
    </div>
  );
}
