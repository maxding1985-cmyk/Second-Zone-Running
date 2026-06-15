import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AnonymousUser } from "@run-chat/shared";

import { createAnonymousUser } from "../api/client";

const STORAGE_KEY = "run-chat.anonymous-user.v1";

export async function ensureAnonymousUser(): Promise<AnonymousUser> {
  const cached = await AsyncStorage.getItem(STORAGE_KEY);
  if (cached) {
    return JSON.parse(cached) as AnonymousUser;
  }

  try {
    const user = await createAnonymousUser({ testerGroup: "seed-v0.1" });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch {
    const fallbackUser: AnonymousUser = {
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      testerGroup: "offline-v0.1",
      createdAt: new Date().toISOString()
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
    return fallbackUser;
  }
}
