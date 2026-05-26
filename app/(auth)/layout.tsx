export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{
          position: "absolute", top: "-20%", left: "-10%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,242,255,0.06) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", right: "-10%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
        }} />
      </div>
      {children}
    </div>
  );
}
