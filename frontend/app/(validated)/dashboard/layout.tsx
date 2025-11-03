import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "./Sidebar";
import { cookies } from "next/headers";
import { getWorkspaces, resolveActiveWorkspace } from "@/lib/workspaces";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const { workspaces } = await getWorkspaces({ includeMembership: true });
  const { activeWorkspace } = await resolveActiveWorkspace({ workspaces });

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardSidebar
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspace?.workspace.id ?? null}
      />
      {children}
    </SidebarProvider>
  );
}
