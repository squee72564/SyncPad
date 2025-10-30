"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "./ui/sidebar";
import { ChevronUp, User2 } from "lucide-react";

import { signOut, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import router, { RedirectType } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccountDropdown() {
  const session = useSession();
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);

  useEffect(() => {
    if (!session || !session.data) {
      return;
    }

    if (isLoggedOut) {
      router.redirect("/signin", RedirectType.replace);
    }
  }, [session, isLoggedOut]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
            try {
              await signOut();
              toast.info("Logged out");
              setIsLoggedOut(true);
            } catch (error) {
              toast.error("Error logging out");
              console.error(error);
            }
          }}
        >
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
