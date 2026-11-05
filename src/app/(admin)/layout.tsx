import { AppSidebar } from "@/components/shell/app-sidebar";
import { TopBar } from "@/components/shell/top-bar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      <AppSidebar />
      <main className="min-w-0 flex-1 space-y-8 p-4 sm:p-8">
        <TopBar />
        {children}
      </main>
    </div>
  );
}
