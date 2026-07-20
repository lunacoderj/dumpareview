import { messaging } from "./firebase";
import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { apiFetch } from "./api";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const msg = await messaging();
      if (!msg) return false;

      const currentToken = await getToken(msg, { vapidKey: VAPID_KEY });
      
      if (currentToken) {
        console.log("Got FCM Token:", currentToken);
        // Store the token in the backend mapping it to the user
        await apiFetch('/api/user/fcm-token', {
          method: 'POST',
          body: JSON.stringify({ token: currentToken })
        }).catch(err => console.error("Error saving token:", err));

        return true;
      } else {
        console.log("No registration token available. Request permission to generate one.");
        return false;
      }
    } else {
      console.log("Notification permission not granted.");
      return false;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token. ", error);
    return false;
  }
};

export const setupForegroundMessageListener = async (onMessageReceived: (payload: MessagePayload) => void) => {
  const msg = await messaging();
  if (!msg) return undefined;
  
  return onMessage(msg, (payload) => {
    console.log("Foreground Message received: ", payload);
    onMessageReceived(payload);
  });
};
