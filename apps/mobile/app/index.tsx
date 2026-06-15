import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>AI 二区语音陪跑</Text>
        <Text style={styles.title}>只要还能聊天，就别急着加速。</Text>
        <Text style={styles.body}>
          跑步聊天会让你在跑中开口说完整句，用说话测试帮你判断是否跑在轻松有氧强度。
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>v0.2 先验证一件事</Text>
        <Text style={styles.cardBody}>你是否愿意跑步时开口说话，以及 AI 提醒能不能帮你慢下来。</Text>
      </View>

      <View style={styles.actions}>
        <Link href="/pre-run" style={styles.primaryButton}>
          开始聊天跑
        </Link>
        <View style={styles.secondaryLinks}>
          <Link href="/inner-test" style={styles.secondaryLink}>内测任务</Link>
          <Link href="/admin" style={styles.secondaryLink}>运营看板</Link>
          <Link href="/settings" style={styles.secondaryLink}>隐私安全</Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "#F3EFE5"
  },
  hero: {
    paddingTop: 56
  },
  kicker: {
    color: "#6B7A39",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16
  },
  title: {
    color: "#243126",
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1.2
  },
  body: {
    color: "#536052",
    fontSize: 18,
    lineHeight: 28,
    marginTop: 20
  },
  card: {
    backgroundColor: "#FFF9EA",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E0D6BB"
  },
  cardTitle: {
    color: "#243126",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8
  },
  cardBody: {
    color: "#66705D",
    fontSize: 16,
    lineHeight: 24
  },
  actions: {
    gap: 14
  },
  primaryButton: {
    overflow: "hidden",
    textAlign: "center",
    backgroundColor: "#243126",
    color: "#FFF9EA",
    fontSize: 20,
    fontWeight: "900",
    paddingVertical: 18,
    borderRadius: 999
  },
  secondaryLinks: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  secondaryLink: {
    color: "#61705C",
    fontSize: 14,
    fontWeight: "900"
  }
});
