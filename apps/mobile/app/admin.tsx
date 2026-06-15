import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { API_BASE_URL, getAdminMetrics, getAdminSessions } from "../src/lib/api/client";

type AdminState = {
  metrics?: Record<string, unknown>;
  sessions?: Array<Record<string, unknown>>;
};

const metricLabels: Array<[string, string, "number" | "percent"]> = [
  ["totalSessions", "总跑步次数", "number"],
  ["completedSessions", "完成次数", "number"],
  ["completed15MinSessions", "15 分钟完成", "number"],
  ["completed15MinRate", "15 分钟完成率", "percent"],
  ["sessionsWithVoiceResponse", "至少开口会话", "number"],
  ["voiceOpenRate", "开口率", "percent"],
  ["sessionsWith3VoiceResponses", "3 次语音会话", "number"],
  ["voiceMultiRoundRate", "多轮语音率", "percent"],
  ["sttUsableRate", "STT 可用率", "percent"],
  ["zone2UnderstandingRate", "二区理解率", "percent"],
  ["voiceHelpfulRate", "语音有用率", "percent"],
  ["humanCompanionInterestRate", "真人兴趣率", "percent"],
  ["helpfulRate", "整体主观有效率", "percent"],
  ["positiveNextRunRate", "复用意愿率", "percent"],
  ["averageDurationSec", "平均时长", "number"]
];

export default function AdminScreen() {
  const [state, setState] = useState<AdminState>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  async function loadData() {
    setStatus("loading");
    try {
      const [metrics, sessionResult] = await Promise.all([getAdminMetrics(), getAdminSessions()]);
      setState({ metrics, sessions: sessionResult.sessions });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const sessions = state.sessions ?? [];

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.kicker}>内测运营看板</Text>
      <Text style={styles.title}>用数据判断 v0.2 说话测试是否成立。</Text>
      <Text style={styles.subtitle}>这里优先看开口率、多轮语音率、STT 可用率、二区理解率和真人陪跑兴趣。</Text>

      <Pressable style={styles.refreshButton} onPress={() => void loadData()}>
        <Text style={styles.refreshText}>{status === "loading" ? "刷新中..." : "刷新数据"}</Text>
      </Pressable>

      {status === "error" ? <Text style={styles.errorText}>无法连接 API，请先启动 `npm run dev:api`。</Text> : null}

      <View style={styles.grid}>
        {metricLabels.map(([key, label, type]) => (
          <View key={key} style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatMetric(state.metrics?.[key], type)}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>数据导出</Text>
        <Text style={styles.cardBody}>JSON: {API_BASE_URL}/api/admin/export.json</Text>
        <Text style={styles.cardBody}>CSV: {API_BASE_URL}/api/admin/export.csv</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>最近会话</Text>
        {sessions.slice(-5).reverse().map((session) => (
          <View key={String(session.id)} style={styles.sessionRow}>
            <Text style={styles.sessionTitle}>{String(session.mode)} · {String(session.status)}</Text>
            <Text style={styles.sessionMeta}>
              {formatMetric(session.durationSec, "number")} · 语音 {String((session.voiceStats as Record<string, unknown> | undefined)?.voiceResponseCount ?? 0)} · 完整句 {String((session.voiceStats as Record<string, unknown> | undefined)?.completeSentenceCount ?? 0)}
            </Text>
          </View>
        ))}
        {sessions.length === 0 ? <Text style={styles.emptyText}>暂无内测数据，先完成一次聊天跑。</Text> : null}
      </View>
    </ScrollView>
  );
}

function formatMetric(value: unknown, type: "number" | "percent") {
  if (typeof value !== "number") {
    return "--";
  }

  if (type === "percent") {
    return `${Math.round(value * 100)}%`;
  }

  if (value >= 60 && Number.isInteger(value)) {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}m${seconds.toString().padStart(2, "0")}`;
  }

  return String(value);
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
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40
  },
  subtitle: {
    color: "#61705C",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 18
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: "#243126",
    borderRadius: 999,
    paddingVertical: 14,
    marginBottom: 16
  },
  refreshText: {
    color: "#FFF9EA",
    fontSize: 16,
    fontWeight: "900"
  },
  errorText: {
    color: "#A15C2F",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 12
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#FFF9EA",
    borderColor: "#E0D6BB",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16
  },
  metricValue: {
    color: "#243126",
    fontSize: 28,
    fontWeight: "900"
  },
  metricLabel: {
    color: "#61705C",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4
  },
  card: {
    backgroundColor: "#FFF9EA",
    borderColor: "#E0D6BB",
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 18,
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
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22
  },
  sessionRow: {
    borderTopColor: "#E0D6BB",
    borderTopWidth: 1,
    paddingVertical: 12
  },
  sessionTitle: {
    color: "#243126",
    fontSize: 15,
    fontWeight: "900"
  },
  sessionMeta: {
    color: "#61705C",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4
  },
  emptyText: {
    color: "#61705C",
    fontSize: 14,
    fontWeight: "800"
  }
});
