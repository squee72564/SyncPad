"use client";

import { useIsMobile } from "@/hooks/use-mobile";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HomeNavigationMenu({ className }: { className?: string }) {
  const isMobile = useIsMobile();

  return (
    <NavigationMenu className={cn("relative z-50 max-w-full", className)} viewport={isMobile}>
      <NavigationMenuList className="flex-wrap">
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/">Home</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
          <NavigationMenuContent className="z-50">
            <ul className="grid gap-2 md:w-[420px] lg:w-[520px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className="from-primary/20 to-background flex h-full w-full flex-col justify-end rounded-md bg-linear-to-br p-4 no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-6"
                    href="/#features"
                  >
                    <div className="mb-2 text-lg font-semibold sm:mt-4">
                      Why teams choose SyncPad
                    </div>
                    <p className="text-muted-foreground text-sm leading-tight">
                      Author, review, and discover institutional knowledge with realtime
                      collaboration and AI-assisted search built on secure workspaces.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="/#overview" title="Workspace overview">
                See how documents, comments, and activity come together in one timeline.
              </ListItem>
              <ListItem href="/#features" title="Realtime collaboration">
                Conflict-free editing, inline reviews, and presence indicators for distributed
                teams.
              </ListItem>
              <ListItem href="/docs" title="Product documentation">
                Dive into the roadmap, APIs, and deployment guidance as SyncPad evolves.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent className="z-50">
            <ul className="grid w-[220px] gap-3 p-4">
              <ListItem href="/about" title="About SyncPad">
                Learn about the mission and the roadmap behind the product.
              </ListItem>
              <ListItem href="/docs" title="Documentation">
                Get started with environment setup, workflows, and best practices.
              </ListItem>
              <ListItem href="/contact" title="Contact">
                Chat with the team about pilots, integrations, or partnerships.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/about">About Us</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
