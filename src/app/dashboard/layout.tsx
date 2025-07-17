
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <main className="flex-1 overflow-hidden bg-background">
        <ScrollArea className="h-full">
            {children}
        </ScrollArea>
      </main>
      <AppFooter />
    </div>
  );
}
