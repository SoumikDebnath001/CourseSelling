import { Navbar, Footer } from "@/components/layout/Navbar";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
