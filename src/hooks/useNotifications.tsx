import { useState, useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiFetch("/api/user/notifications");
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n: Notification) => !n.read).length);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/user/notifications/${id}/read`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch(`/api/user/notifications/read-all`, { method: "PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const msg = await messaging();
        if (msg) {
          // Note: You need a VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
          // We will use standard getToken without vapidKey if not provided, but it's recommended to have one.
          const currentToken = await getToken(msg, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
          });
          
          if (currentToken) {
            // Send token to your backend
            await apiFetch('/api/user/fcm-token', {
              method: 'POST',
              body: JSON.stringify({ token: currentToken })
            });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        }
      }
    } catch (err) {
      console.log('An error occurred while retrieving token. ', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      requestPermission();

      messaging().then(msg => {
        if (msg) {
          const unsubscribe = onMessage(msg, (payload) => {
            console.log('Message received. ', payload);
            toast({
              title: payload.notification?.title || "New Notification",
              description: payload.notification?.body || "",
            });
            // Reload notifications list
            loadNotifications();
          });
          return () => unsubscribe();
        }
      });
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    reload: loadNotifications
  };
}
