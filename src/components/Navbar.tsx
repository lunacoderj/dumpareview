import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, X, LayoutList, Clock, CreditCard, UserCircle, Briefcase, ListTodo, ShieldCheck, FileCheck2, Star, Bell, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userLinks = [
    { to: "/tasks", label: "Active Tasks", icon: LayoutList },
    { to: "/issued", label: "Issued", icon: Clock },
    { to: "/payout", label: "Payout", icon: CreditCard },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ];

  const adminLinks = [
    { to: "/admin", label: "Campaigns", icon: Briefcase },
    { to: "/admin/queue", label: "Queue", icon: ListTodo },
    { to: "/admin/audit", label: "Audit", icon: ShieldCheck },
    { to: "/admin/proofs", label: "Proofs", icon: FileCheck2 },
    { to: "/admin/wall-of-fame", label: "Fame", icon: Star },
  ];

  const navLinks = user ? (isAdmin ? adminLinks : userLinks) : [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nav-blur sticky top-0 z-50 border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-primary/30 group-hover:scale-105 transition-transform">
              <span className="font-bold text-white">D</span>
            </div>
            <span className="font-bold text-xl font-display">DumpAReview {isAdmin && <span className="text-xs text-primary ml-1 uppercase">Admin</span>}</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive(to)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth & Notifications section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative p-2 rounded-full hover:bg-secondary transition-colors focus:outline-none">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead} 
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <ScrollArea className="h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4">
                          <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No notifications yet.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => !notif.read && markAsRead(notif.id)}
                              className={cn(
                                "px-4 py-3 border-b border-border/40 hover:bg-secondary/50 cursor-pointer transition-colors",
                                !notif.read ? "bg-primary/5" : ""
                              )}
                            >
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className={cn("text-sm font-medium", !notif.read ? "text-foreground" : "text-muted-foreground")}>
                                  {notif.title}
                                </span>
                                {!notif.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                              <span className="text-[10px] text-muted-foreground/70 mt-2 block">
                                {new Date(notif.created_at).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Profile Dropdown */}
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-secondary transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.displayName?.[0] ?? user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-foreground max-w-32 truncate">
                      {user.displayName ?? user.email}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {!isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <UserCircle className="h-4 w-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            {user && (
              <button
                className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && user && (
          <div className="md:hidden pb-4 pt-2 space-y-1 border-t border-border/50 mt-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive(to)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
