import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppSidebarRight } from "@/components/sidebar/app-sidebar-right";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <SidebarProvider
        defaultOpen={false}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>{children}</SidebarInset>
        <AppSidebarRight variant="inset" />
      </SidebarProvider>
    </div>
  );
}
