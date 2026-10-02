import { getAccessToken, registerPushDevice } from "@/lib/api"; // adjust path to match your project
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function handleRegistrationError(errorMessage: string): never {
  throw new Error(errorMessage);
}

export async function registerForPushNotificationsAsync(): Promise<string> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    handleRegistrationError(
      "Permission not granted to get push token for push notification!",
    );
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    handleRegistrationError("Project ID not found");
  }

  const pushTokenString = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  await registerPushDevice(
    pushTokenString,
    Platform.OS as "ios" | "android",
    Constants?.expoConfig?.version ?? null,
  );

  return pushTokenString;
}

export function usePushRegistration(isLoggedIn: boolean) {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!getAccessToken()) return;

    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token))
      .catch((e: any) => setError(e?.message ?? String(e)));

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notif) => {
        setNotification(notif);
      },
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [isLoggedIn]);

  return { expoPushToken, error, notification };
}
