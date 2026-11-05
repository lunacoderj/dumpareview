import { useState, useEffect } from "react";
import { Bell, Check, X, Sparkles, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { generate100Reviews } from "@/lib/geminiReviews";
import { formatDistanceToNow } from "date-fns";

export interface NotificationItem {
  id: string;
  user_id: string;
  qr_code_id: string;
  type: string;
  title: string;
  message: string;
  action_type: string;
  action_status: string;
  is_read: boolean;
  created_at: string;
  qr_codes?: {
    name: string;
    business_category?: string;
  };
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.uid)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        const rawList = data as unknown as Record<string, unknown>[];
        const normalized: NotificationItem[] = rawList.map((n) => ({
          id: String(n.id || ""),
          user_id: String(n.user_id || ""),
          qr_code_id: String(n.qr_code_id || ""),
          type: String(n.type || "system"),
          title: String(n.title || "Notification"),
          message: String(n.message || ""),
          action_type: String(n.action_type || "none"),
          action_status: String(n.action_status || "pending"),
          is_read: n.is_read !== undefined ? Boolean(n.is_read) : Boolean(n.read),
          created_at: String(n.created_at || new Date().toISOString()),
        }));

        // Enrich with QR names without requiring foreign key join in Supabase
        const qrIds = Array.from(new Set(normalized.map((n) => n.qr_code_id).filter(Boolean)));
        if (qrIds.length > 0) {
          const { data: qrs } = await supabase
            .from("qr_codes")
            .select("id, name")
            .in("id", qrIds);
          if (qrs) {
            const qrMap = new Map((qrs as { id: string; name: string }[]).map((q) => [q.id, q.name]));
            normalized.forEach((n) => {
              if (n.qr_code_id && qrMap.has(n.qr_code_id)) {
                n.qr_codes = { name: qrMap.get(n.qr_code_id)! };
              }
            });
          }
        }

        setNotifications(normalized);
        setUnreadCount(normalized.filter((n) => !n.is_read).length);
      }
    } catch {
      // Table might be initializing or offline
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await Promise.allSettled([
        supabase.from("notifications").update({ is_read: true }).eq("user_id", user.uid),
        supabase.from("notifications").update({ read: true }).eq("user_id", user.uid),
      ]);
    } catch {
      // Ignore update error
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleAcceptRefill = async (notif: NotificationItem) => {
    setProcessingId(notif.id);
    try {
      const qrName = notif.qr_codes?.name || "Business";
      const qrCategory = notif.qr_codes?.business_category || "General";

      toast.info(`Generating 100 new reviews for ${qrName}...`);
      const newMessages = await generate100Reviews({
        businessName: qrName,
        category: qrCategory,
      });

      // Update QR Code with new 100 messages (with fallback for legacy schema)
      const fullPayload = {
        messages: newMessages,
        message_used_counts: new Array(newMessages.length).fill(0),
        current_message_index: 0,
        status: "active",
        auto_refill_prompted: false,
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let { error: qrError } = await supabase
        .from("qr_codes")
        .update(fullPayload)
        .eq("id", notif.qr_code_id);

      if (qrError) {
        console.warn("[DumpaReview] Full update failed, falling back to core columns:", qrError.message);
        const fbRes = await supabase
          .from("qr_codes")
          .update({
            messages: newMessages,
            message_used_counts: new Array(newMessages.length).fill(0),
            current_message_index: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", notif.qr_code_id);
        qrError = fbRes.error;
      }

      if (qrError) throw qrError;

      // Update notification status
      try {
        await supabase
          .from("notifications")
          .update({ action_status: "accepted", is_read: true })
          .eq("id", notif.id);
      } catch {
        // Notification action update optional
      }

      toast.success(`Success! 100 fresh reviews loaded for ${qrName}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate new messages. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRefill = async (notif: NotificationItem) => {
    setProcessingId(notif.id);
    try {
      await supabase
        .from("notifications")
        .update({ action_status: "rejected", is_read: true })
        .eq("id", notif.id);

      toast.info("Refill declined. Current messages will continue cycling.");
      fetchNotifications();
    } catch {
      toast.error("Error updating notification.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-secondary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-[10px] animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-2xl border-border">
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-sm">Notifications</h4>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition-colors ${
                  !notif.is_read ? "bg-primary/5" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {notif.type === "messages_exhausted" ? (
                      <div className="h-7 w-7 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-foreground leading-snug">
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 pt-0.5">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>

                    {/* Action buttons for refill permission */}
                    {notif.action_type === "refill_permission" && notif.action_status === "pending" && (
                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={processingId === notif.id}
                          onClick={() => handleAcceptRefill(notif)}
                          className="h-7 text-xs hero-gradient text-white font-bold"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Accept & Generate 100
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === notif.id}
                          onClick={() => handleRejectRefill(notif)}
                          className="h-7 text-xs font-semibold"
                        >
                          Keep Current
                        </Button>
                      </div>
                    )}

                    {notif.action_status === "accepted" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5">
                        <Check className="h-3 w-3" /> 100 New Reviews Generated
                      </span>
                    )}

                    {notif.action_status === "rejected" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1.5">
                        <X className="h-3 w-3" /> Declined
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

