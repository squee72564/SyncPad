"use client";

import { LogOutIcon } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div
      className={cn(className, "")}
      onClick={async () => {
        try {
          await signOut();
          toast.info("Logged out");
          router.replace("/");
        } catch (error) {
          toast.error("Error logging out");
          console.error(error);
        }
      }}
    >
      <LogOutIcon />
      <span>Sign Out</span>
    </div>
  );
}
