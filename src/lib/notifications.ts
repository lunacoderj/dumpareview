// Firebase Cloud Messaging removed. These are no-op stubs so existing
// imports keep working. Wire up a Lovable Cloud–compatible push provider later
// if push notifications are needed.
export type MessagePayload = { notification?: { title?: string; body?: string } };

export const requestNotificationPermission = async (): Promise<boolean> => {
  return false;
};

export const setupForegroundMessageListener = async (
  _onMessageReceived: (payload: MessagePayload) => void,
): Promise<(() => void) | undefined> => {
  return undefined;
};
