// Initialisation du SDK OneSignal Web Push.
// L'App ID est exposé via VITE_ONESIGNAL_APP_ID (publishable côté client).

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

let initialized = false;

export const initPush = (appId: string) => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Charge le SDK une seule fois.
  const script = document.createElement("script");
  script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  script.defer = true;
  document.head.appendChild(script);

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    await OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
    });
  });
};

export const requestPushPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.Notifications.requestPermission();
        resolve(OneSignal.Notifications.permission === true);
      } catch {
        resolve(false);
      }
    });
  });
};

export const isPushEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.OneSignal?.Notifications?.permission === true;
};