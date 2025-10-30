import AccountDropdown from "@/components/AccountDropdown";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LucideBookPlus } from "lucide-react";
import Link from "next/link";

export default function DashboardSidebar() {
  return (
    <Sidebar variant={"sidebar"} collapsible={"icon"}>
      <SidebarHeader>
        <h1 className="truncate text-center">SyncPad</h1>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Docs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/docs/create">
                    <LucideBookPlus />
                    <span>Create New Document</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <AccountDropdown />
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
}
