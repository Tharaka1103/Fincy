"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  HalfMoon,
  SunLight,
  Laptop,
  MoreVert,
  LogOut,
  User,
  NavArrowRight,
} from "iconoir-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "F";

  function ThemeIcon() {
    if (!mounted) return <Laptop className="h-4 w-4" strokeWidth={1.8} />;
    if (theme === "dark") return <HalfMoon className="h-4 w-4" strokeWidth={1.8} />;
    if (theme === "light") return <SunLight className="h-4 w-4" strokeWidth={1.8} />;
    return <Laptop className="h-4 w-4" strokeWidth={1.8} />;
  }

  return (
    <header className="sticky top-0 z-40 w-full glass-nav">
      <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          href="/dashboard"
          prefetch={true}
          className="flex items-center gap-2 group cursor-pointer"
          id="header-logo"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <span className="text-primary-foreground font-black text-sm">F</span>
            </div>
            <div className="absolute inset-0 rounded-xl bg-primary blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-200" />
          </div>
          <span className="font-heading font-black text-xl tracking-tight gradient-text select-none">
            FINCY
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger
              id="theme-toggle-btn"
              className="h-9 w-9 rounded-xl glass-subtle hover:glow-sm transition-all duration-200 flex items-center justify-center cursor-pointer text-foreground"
              aria-label="Toggle theme"
            >
              <ThemeIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-0 min-w-36">
              <DropdownMenuItem id="theme-light" onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
                <SunLight className="h-4 w-4" strokeWidth={1.8} /> Light
              </DropdownMenuItem>
              <DropdownMenuItem id="theme-dark" onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
                <HalfMoon className="h-4 w-4" strokeWidth={1.8} /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem id="theme-system" onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
                <Laptop className="h-4 w-4" strokeWidth={1.8} /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Three dots + user menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              id="user-menu-btn"
              className="h-9 w-9 rounded-xl glass-subtle hover:glow-sm transition-all duration-200 flex items-center justify-center cursor-pointer text-foreground"
              aria-label="User menu"
            >
              <MoreVert className="h-4 w-4" strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-0 w-64 p-0 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                    <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {user?.name ?? "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email ?? ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-1">
                <DropdownMenuItem
                  id="menu-profile"
                  className="gap-2 rounded-lg cursor-pointer"
                  onClick={() => { window.location.href = "/settings"; }}
                >
                  <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                  <span>Profile & Settings</span>
                  <NavArrowRight className="h-4 w-4 ml-auto text-muted-foreground" strokeWidth={1.8} />
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-border/40" />

                <DropdownMenuItem
                  id="menu-logout"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="gap-2 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.8} />
                  <span>Log out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
