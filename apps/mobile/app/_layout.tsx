import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#F3EFE5" },
          headerTintColor: "#243126",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#F3EFE5" }
        }}
      >
        <Stack.Screen name="index" options={{ title: "跑步聊天" }} />
        <Stack.Screen name="pre-run" options={{ title: "选择今天的跑法" }} />
        <Stack.Screen name="safety" options={{ title: "安全提示" }} />
        <Stack.Screen name="run-session" options={{ title: "聊天跑进行中", headerBackVisible: false }} />
        <Stack.Screen name="report" options={{ title: "本次报告", headerBackVisible: false }} />
        <Stack.Screen name="admin" options={{ title: "内测看板" }} />
        <Stack.Screen name="inner-test" options={{ title: "内测任务" }} />
        <Stack.Screen name="settings" options={{ title: "隐私与安全" }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
