import * as React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 mesh-bg relative overflow-hidden">
      {/* Decorative blobs */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--primary)" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "var(--chart-1)" }}
        aria-hidden="true"
      />
      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  );
}
