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
  Users,
  UserPlus,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

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

const mockCounts = {
  invites: 3,
  drafts: 6,
  shareLinks: 4,
  reviewThreads: 9,
  aiJobs: 2,
};

const navSections: NavSection[] = [
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
        badge: String(mockCounts.invites),
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
        badge: String(mockCounts.drafts),
        tooltip: "Documents in progress",
      },
      {
        title: "Published",
        href: "/dashboard/documents/published",
        icon: FileCheck,
        tooltip: "Published workspace docs",
      },
      {
        title: "Share Links",
        href: "/dashboard/documents/share-links",
        icon: Share2,
        badge: String(mockCounts.shareLinks),
        tooltip: "Public and guest access",
      },
      {
        title: "Review Threads",
        href: "/dashboard/documents/reviews",
        icon: MessageSquareMore,
        badge: String(mockCounts.reviewThreads),
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
        badge: String(mockCounts.aiJobs),
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

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant={"sidebar"} collapsible={"icon"}>
      <SidebarHeader>
        <h1 className="truncate text-center font-semibold tracking-tight">SyncPad</h1>
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
