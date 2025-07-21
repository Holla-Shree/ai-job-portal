
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <AppFooter />
    </div>
  );
}
