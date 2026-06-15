import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const tasks = [
  {
    title: "任务 1：首次体验",
    body: "打开 App，选择任意场景，完成至少 5 分钟说话测试跑，至少开口回应 1 次。"
  },
  {
    title: "任务 2：15 分钟轻松跑",
    body: "选择“轻松跑”或“新手慢跑”，完成 15 分钟以上，并至少完成 3 次语音说话测试。"
  },
  {
    title: "任务 3：下班解压跑",
    body: "在真实下班后体验一次，观察 AI 的语音提醒是否能让你主动慢下来。"
  }
];

export default function InnerTestScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.kicker}>Seed Test v0.2</Text>
      <Text style={styles.title}>10-20 人说话测试内测</Text>
      <Text style={styles.subtitle}>目标不是跑快，而是验证你是否愿意跑中开口说话，以及说话测试是否能帮你控制二区/轻松有氧强度。</Text>

      {tasks.map((task) => (
        <View key={task.title} style={styles.card}>
          <Text style={styles.cardTitle}>{task.title}</Text>
          <Text style={styles.cardBody}>{task.body}</Text>
        </View>
      ))}

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>安全边界</Text>
        <Text style={styles.warningBody}>如出现胸痛、头晕、异常心悸、呼吸困难或快要晕倒，请立即停止运动并寻求专业帮助。App 不提供医疗诊断。</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>跑后一定要填</Text>
        <Text style={styles.cardBody}>是否更理解二区、说话测试是否有帮助、是否想试真人陪跑。这些数据决定是否进入真人匹配。</Text>
      </View>

      <Link href="/pre-run" style={styles.primaryButton}>开始内测跑</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F3EFE5"
  },
  kicker: {
    color: "#6B7A39",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 8
  },
  title: {
    color: "#243126",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 44
  },
  subtitle: {
    color: "#61705C",
    fontSize: 17,
    lineHeight: 26,
    marginTop: 12,
    marginBottom: 18
  },
  card: {
    backgroundColor: "#FFF9EA",
    borderColor: "#E0D6BB",
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18
  },
  cardTitle: {
    color: "#243126",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8
  },
  cardBody: {
    color: "#52604E",
    fontSize: 16,
    lineHeight: 24
  },
  warningCard: {
    backgroundColor: "#FFE6D6",
    borderColor: "#F2B08B",
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18
  },
  warningTitle: {
    color: "#7A341D",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8
  },
  warningBody: {
    color: "#7A341D",
    fontSize: 16,
    lineHeight: 24
  },
  primaryButton: {
    overflow: "hidden",
    textAlign: "center",
    backgroundColor: "#243126",
    color: "#FFF9EA",
    fontSize: 18,
    fontWeight: "900",
    paddingVertical: 17,
    borderRadius: 999,
    marginTop: 8
  }
});
