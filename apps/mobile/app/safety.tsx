import { SAFETY_NOTICE } from "@run-chat/shared";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SafetyScreen() {
  const params = useLocalSearchParams<{ mode?: string; coachStyle?: string; educationDurationSec?: string }>();

  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.title}>先确认一件事</Text>
        <Text style={styles.subtitle}>跑步聊天只帮你做陪伴和强度提醒，不替代医生或专业诊断。</Text>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>运动安全提示</Text>
          <Text style={styles.noticeBody}>{SAFETY_NOTICE}</Text>
        </View>

        <View style={styles.ruleCard}>
          <Text style={styles.rule}>1. 今天不拼速度。</Text>
          <Text style={styles.rule}>2. 能完整说话就是好节奏。</Text>
          <Text style={styles.rule}>3. 觉得不舒服就慢走或停止。</Text>
          <Text style={styles.rule}>4. 跑中会请求麦克风权限，只用于说话测试和强度反馈。</Text>
        </View>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() =>
          router.replace({
            pathname: "/run-session",
            params: {
              mode: params.mode ?? "after_work_reset",
              coachStyle: params.coachStyle ?? "gentle",
              educationDurationSec: params.educationDurationSec ?? "0"
            }
          })
        }
      >
        <Text style={styles.primaryText}>我知道了，开始跑</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
    backgroundColor: "#F3EFE5"
  },
  title: {
    color: "#243126",
    fontSize: 36,
    fontWeight: "900",
    marginTop: 32
  },
  subtitle: {
    color: "#61705C",
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
    marginBottom: 24
  },
  noticeCard: {
    backgroundColor: "#FFE6D6",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F2B08B"
  },
  noticeTitle: {
    color: "#7A341D",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 8
  },
  noticeBody: {
    color: "#7A341D",
    fontSize: 16,
    lineHeight: 25
  },
  ruleCard: {
    marginTop: 18,
    backgroundColor: "#FFF9EA",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0D6BB"
  },
  rule: {
    color: "#243126",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 30
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#243126",
    borderRadius: 999,
    paddingVertical: 17
  },
  primaryText: {
    color: "#FFF9EA",
    fontSize: 18,
    fontWeight: "900"
  }
});
