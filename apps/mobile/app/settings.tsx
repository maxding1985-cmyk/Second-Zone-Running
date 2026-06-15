import { SAFETY_NOTICE } from "@run-chat/shared";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const items = [
  {
    title: "我们采集什么",
    body: "v0.1 只记录匿名用户 ID、跑步会话、跑中反馈、AI 提示事件、退出原因和跑后问卷。"
  },
  {
    title: "我们暂不采集什么",
    body: "当前版本不接入定位、心率、通讯录、真实姓名，也不长期保存原始语音。"
  },
  {
    title: "数据用途",
    body: "仅用于判断 MVP 是否成立：完成率、反馈参与率、主观有效率、复用意愿和退出原因。"
  }
];

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.kicker}>隐私与安全</Text>
      <Text style={styles.title}>先保护用户，再验证产品。</Text>
      <Text style={styles.subtitle}>跑步聊天 v0.1 是内测验证产品，不提供医疗诊断，不承诺避免运动风险。</Text>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>运动安全提示</Text>
        <Text style={styles.warningBody}>{SAFETY_NOTICE}</Text>
      </View>

      {items.map((item) => (
        <View key={item.title} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardBody}>{item.body}</Text>
        </View>
      ))}
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
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42
  },
  subtitle: {
    color: "#61705C",
    fontSize: 17,
    lineHeight: 26,
    marginTop: 12,
    marginBottom: 18
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
  }
});
