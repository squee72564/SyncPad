"use client";

import AccountDropdown from "@/components/AccountDropdown";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FileCheck,
  FilePenLine,
  FileText,
  History,
  LayoutDashboard,
  MessageSquareMore,
  Network,
  Plus,
  Settings,
  Share2,
  Sparkles,
  NotebookPen,
  Users,
  UserPlus,
  FileSearch,
  FileLock,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import type { WorkspaceSummary } from "@/lib/workspaces";
import WorkspaceSwitcher from "./workspaces/WorkspaceSwitcher";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  tooltip?: string;
  exact?: boolean;
};

type NavSection = {
  label: string;
  action?: {
    href: string;
    icon: LucideIcon;
    tooltip: string;
  };
  items: NavItem[];
};

const buildNavSections = (): NavSection[] => [
  {
    label: "Workspace",
    action: {
      href: "/dashboard/workspaces/new",
      icon: Plus,
      tooltip: "Create workspace",
    },
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        tooltip: "Workspace overview",
        exact: true,
      },
      {
        title: "Members & Roles",
        href: "/dashboard/members",
        icon: Users,
        tooltip: "Manage workspace members",
      },
      {
        title: "Invites & Access",
        href: "/dashboard/invites",
        icon: UserPlus,
        tooltip: "Pending invitations",
      },
      {
        title: "Activity Log",
        href: "/dashboard/activity",
        icon: History,
        tooltip: "Workspace activity timeline",
      },
    ],
  },
  {
    label: "Documents",
    action: {
      href: "/dashboard/documents/new",
      icon: Plus,
      tooltip: "Create document",
    },
    items: [
      {
        title: "All Documents",
        href: "/dashboard/documents",
        icon: FileText,
        tooltip: "Browse workspace documents",
      },
      {
        title: "Drafts",
        href: "/dashboard/documents/drafts",
        icon: FilePenLine,
        tooltip: "Documents in progress",
      },
      {
        title: "In Review",
        href: "/dashboard/documents/review",
        icon: FileSearch,
        tooltip: "Documents in review",
      },
      {
        title: "Published",
        href: "/dashboard/documents/published",
        icon: FileCheck,
        tooltip: "Published workspace docs",
      },
      {
        title: "Archived",
        href: "/dashboard/documents/archive",
        icon: FileLock,
        tooltip: "Archived workspace docs",
      },
      {
        title: "Share Links",
        href: "/dashboard/documents/share-links",
        icon: Share2,
        tooltip: "Public and guest access",
      },
      {
        title: "Review Threads",
        href: "/dashboard/documents/reviews",
        icon: MessageSquareMore,
        tooltip: "Open comments & suggestions",
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        title: "AI Job Queue",
        href: "/dashboard/ai/jobs",
        icon: Bot,
        tooltip: "Embedding & summary jobs",
      },
      {
        title: "Vector Library",
        href: "/dashboard/ai/embeddings",
        icon: Network,
        tooltip: "Document embeddings & chunks",
      },
      {
        title: "Workspace Q&A",
        href: "/dashboard/ai/qa",
        icon: Sparkles,
        tooltip: "Ask SyncPad about your docs",
      },
      {
        title: "AI Settings",
        href: "/dashboard/ai/settings",
        icon: Settings,
        tooltip: "Model, data & privacy controls",
      },
    ],
  },
];

const renderNavSection = (section: NavSection, pathname: string) => {
  const ActionIcon = section.action?.icon;

  return (
    <SidebarGroup key={section.label}>
      <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
      {section.action && ActionIcon ? (
        <SidebarGroupAction asChild aria-label={section.action.tooltip}>
          <Link href={section.action.href}>
            <ActionIcon className="size-4" />
          </Link>
        </SidebarGroupAction>
      ) : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.exact === true
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.tooltip}>
                  <Link href={item.href}>
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

type DashboardSidebarProps = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
};

export default function DashboardSidebar({ workspaces, activeWorkspaceId }: DashboardSidebarProps) {
  const pathname = usePathname();
  const navSections = buildNavSections();

  return (
    <Sidebar variant={"sidebar"} collapsible={"icon"}>
      <SidebarHeader className="px-2">
        <div className="bg-sidebar-accent/20 text-sidebar-foreground flex items-center justify-center gap-2 rounded-md px-2 py-1">
          <NotebookPen className="size-5 shrink-0" aria-hidden />
          <span className="text-sm font-semibold uppercase tracking-tight group-data-[collapsible=icon]:hidden">
            SyncPad
          </span>
        </div>
        <div className="group-data-[collapsible=icon]:hidden mt-3">
          <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {navSections.map((section) => renderNavSection(section, pathname))}
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
