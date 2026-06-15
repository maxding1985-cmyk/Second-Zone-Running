import { ZONE2_TALK_TEST_EDUCATION, type CoachStyle, type RunMode } from "@run-chat/shared";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { coachStyles, runModes } from "../src/features/run/options";

export default function PreRunScreen() {
  const [mode, setMode] = useState<RunMode>("after_work_reset");
  const [coachStyle, setCoachStyle] = useState<CoachStyle>("gentle");
  const [educationStartedAt] = useState(() => Date.now());

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.kicker}>MVP v0.2 · 先验证说话测试</Text>
      <Text style={styles.title}>今天先学会一件事：跑到还能说完整句。</Text>
      <Text style={styles.subtitle}>这版不再让你跑步时点按钮。核心是你开口说话，App 通过说话测试提醒你别跑过强。</Text>

      <View style={styles.educationCard}>
        <Text style={styles.educationTitle}>什么是二区/轻松有氧说话测试？</Text>
        {ZONE2_TALK_TEST_EDUCATION.map((line, index) => (
          <Text key={line} style={styles.educationLine}>{index + 1}. {line}</Text>
        ))}
      </View>

      <View style={styles.ruleCard}>
        <Text style={styles.ruleTitle}>跑中你要怎么说？</Text>
        <Text style={styles.ruleBody}>AI 会问：“用一句完整的话说说你现在感觉。”你可以回答：“我现在呼吸有点快，但能完整说话。” 如果说不完整，就慢下来。</Text>
      </View>

      <Text style={styles.sectionTitle}>跑步场景</Text>
      {runModes.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => setMode(item.id)}
          style={[styles.option, mode === item.id && styles.optionActive]}
        >
          <Text style={styles.optionTitle}>{item.title}</Text>
          <Text style={styles.optionBody}>{item.subtitle}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>AI 陪跑风格</Text>
      {coachStyles.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => setCoachStyle(item.id)}
          style={[styles.option, coachStyle === item.id && styles.optionActive]}
        >
          <Text style={styles.optionTitle}>{item.title}</Text>
          <Text style={styles.optionBody}>{item.subtitle}</Text>
        </Pressable>
      ))}

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: "/safety",
              params: { mode, coachStyle, educationDurationSec: String(Math.round((Date.now() - educationStartedAt) / 1000)) }
            })
          }
        >
          <Text style={styles.primaryText}>我理解了，下一步</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: "#F3EFE5"
  },
  kicker: {
    color: "#6B7A39",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10
  },
  title: {
    color: "#243126",
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 10
  },
  subtitle: {
    color: "#61705C",
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 18
  },
  educationCard: {
    backgroundColor: "#243126",
    borderRadius: 26,
    padding: 20,
    marginBottom: 14
  },
  educationTitle: {
    color: "#DDE7A6",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10
  },
  educationLine: {
    color: "#FFF9EA",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: 4
  },
  ruleCard: {
    backgroundColor: "#EDF2D0",
    borderColor: "#C9D39A",
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16
  },
  ruleTitle: {
    color: "#243126",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8
  },
  ruleBody: {
    color: "#52604E",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700"
  },
  sectionTitle: {
    color: "#243126",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    marginTop: 10
  },
  option: {
    backgroundColor: "#FFF9EA",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0D6BB"
  },
  optionActive: {
    borderColor: "#6B7A39",
    backgroundColor: "#EDF2D0"
  },
  optionTitle: {
    color: "#243126",
    fontSize: 18,
    fontWeight: "800"
  },
  optionBody: {
    color: "#61705C",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6
  },
  footer: {
    marginTop: 18
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
