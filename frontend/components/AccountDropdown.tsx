"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "./ui/sidebar";
import { ChevronUp, User2 } from "lucide-react";

import { logout } from "@/lib/logout";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";

export default function AccountDropdown() {
  const session = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <SidebarMenuButton>
          <User2 /> <span>{session.data?.user.name || "..."}</span>
          <ChevronUp className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/account">
            <span>Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            startTransition(async () => {
              try {
                await logout();
                toast.info("Logged out");
                setIsOpen(false);
                router.replace("/signin");
              } catch (error) {
                toast.error("Error logging out");
                console.error(error);
              }
            });
          }}
          disabled={isPending}
        >
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
