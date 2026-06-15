import type { HumanCompanionInterest, PostRunFeedback, RunExitReason, RunReport } from "@run-chat/shared";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { getRunReport, submitPostRunFeedback } from "../src/lib/api/client";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} 分 ${seconds.toString().padStart(2, "0")} 秒`;
}

type Helpfulness = PostRunFeedback["perceivedHelpfulness"];
type NextIntent = PostRunFeedback["nextRunIntent"];
type FinalIntensity = PostRunFeedback["perceivedIntensity"];
type Zone2Understanding = NonNullable<PostRunFeedback["zone2Understanding"]>;
type VoiceHelpfulness = NonNullable<PostRunFeedback["voiceHelpfulness"]>;

export default function ReportScreen() {
  const params = useLocalSearchParams<{
    durationSec?: string;
    feedbackCount?: string;
    slowdownMoments?: string;
    voicePromptCount?: string;
    voiceResponseCount?: string;
    validTalkTestCount?: string;
    completeSentenceCount?: string;
    sttFailureCount?: string;
    riskCueCount?: string;
    voiceSlowdownCount?: string;
    manualFallbackCount?: string;
    finishMessage?: string;
    exitReason?: RunExitReason;
    sessionId?: string;
    status?: string;
  }>();

  const fallbackDurationSec = Number(params.durationSec ?? 0);
  const fallbackFeedbackCount = Number(params.feedbackCount ?? 0);
  const fallbackSlowdownMoments = Number(params.slowdownMoments ?? 0);
  const fallbackVoicePromptCount = Number(params.voicePromptCount ?? 0);
  const fallbackVoiceResponseCount = Number(params.voiceResponseCount ?? 0);
  const fallbackValidTalkTestCount = Number(params.validTalkTestCount ?? 0);
  const fallbackCompleteSentenceCount = Number(params.completeSentenceCount ?? 0);
  const fallbackSttFailureCount = Number(params.sttFailureCount ?? 0);
  const fallbackRiskCueCount = Number(params.riskCueCount ?? 0);
  const fallbackVoiceSlowdownCount = Number(params.voiceSlowdownCount ?? 0);
  const fallbackManualFallbackCount = Number(params.manualFallbackCount ?? 0);
  const finishMessage = params.finishMessage;
  const completed = params.status === "completed";
  const exitReason = params.exitReason;
  const sessionId = params.sessionId;

  const [report, setReport] = useState<RunReport>();
  const [helpfulness, setHelpfulness] = useState<Helpfulness>();
  const [nextIntent, setNextIntent] = useState<NextIntent>();
  const [finalIntensity, setFinalIntensity] = useState<FinalIntensity>();
  const [zone2Understanding, setZone2Understanding] = useState<Zone2Understanding>();
  const [voiceHelpfulness, setVoiceHelpfulness] = useState<VoiceHelpfulness>();
  const [humanInterest, setHumanInterest] = useState<HumanCompanionInterest>();
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted" | "offline">("idle");

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isMounted = true;
    getRunReport(sessionId)
      .then((nextReport) => {
        if (isMounted) {
          setReport(nextReport);
        }
      })
      .catch(() => {
        // Keep the local report visible if the API is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const durationSec = report?.durationSec ?? fallbackDurationSec;
  const feedbackCount = report?.feedbackCount ?? fallbackFeedbackCount;
  const slowdownMoments = report?.slowdownMoments ?? fallbackSlowdownMoments;
  const voiceStats = report?.voiceStats;
  const voicePromptCount = voiceStats?.voicePromptCount ?? fallbackVoicePromptCount;
  const voiceResponseCount = voiceStats?.voiceResponseCount ?? fallbackVoiceResponseCount;
  const validTalkTestCount = voiceStats?.validTalkTestCount ?? fallbackValidTalkTestCount;
  const completeSentenceCount = voiceStats?.completeSentenceCount ?? fallbackCompleteSentenceCount;
  const sttFailureCount = voiceStats?.sttFailureCount ?? fallbackSttFailureCount;
  const riskCueCount = voiceStats?.riskCueCount ?? fallbackRiskCueCount;
  const voiceSlowdownCount = voiceStats?.slowdownCueCount ?? fallbackVoiceSlowdownCount;
  const manualFallbackCount = voiceStats?.manualFallbackCount ?? fallbackManualFallbackCount;
  const canSubmit = Boolean(
    sessionId &&
      helpfulness &&
      nextIntent &&
      finalIntensity &&
      zone2Understanding &&
      voiceHelpfulness &&
      humanInterest &&
      submitState !== "submitted"
  );

  const suggestion = useMemo(() => {
    if (report?.nextSuggestion) {
      return report.nextSuggestion;
    }

    return "继续做 15-20 分钟轻松聊天跑。只要还能完整说话，就先保持这个节奏。";
  }, [report]);

  async function handleSubmitFeedback() {
    if (!sessionId || !helpfulness || !nextIntent || !finalIntensity) {
      return;
    }

    setSubmitState("submitting");
    try {
      await submitPostRunFeedback(sessionId, {
        perceivedHelpfulness: helpfulness,
        nextRunIntent: nextIntent,
        perceivedIntensity: finalIntensity,
        zone2Understanding,
        voiceHelpfulness,
        humanCompanionInterest: humanInterest,
        comment: comment.trim() || undefined
      });
      setSubmitState("submitted");
    } catch {
      setSubmitState("offline");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View>
        <Text style={styles.kicker}>{completed ? "轻松完成" : "已记录这次尝试"}</Text>
        <Text style={styles.title}>这次核心是：你有没有开口说话。</Text>
        <Text style={styles.subtitle}>
          v0.2 报告只关注说话测试、完整句、降速提醒和安全兜底，不用配速评价你。
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(durationSec)}</Text>
            <Text style={styles.statLabel}>陪跑时长</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{voiceResponseCount}/{voicePromptCount}</Text>
            <Text style={styles.statLabel}>语音回应 / 说话测试</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completeSentenceCount}</Text>
            <Text style={styles.statLabel}>完整句次数</Text>
          </View>
        </View>

        <View style={styles.voiceReportCard}>
          <Text style={styles.suggestionTitle}>说话测试结果</Text>
          <Text style={styles.suggestionBody}>有效说话测试：{validTalkTestCount} 次；语音降速提醒：{voiceSlowdownCount} 次；STT 失败：{sttFailureCount} 次；安全兜底：{riskCueCount} 次；按钮 fallback：{manualFallbackCount} 次。</Text>
          <Text style={styles.nextTitle}>MVP 判断</Text>
          <Text style={styles.suggestionBody}>{voiceResponseCount > 0 ? "你已经完成了 v0.2 的核心行为：跑中开口说话。" : "本次还没有完成语音回应，不能算核心 MVP 有效样本。"}</Text>
        </View>

        {exitReason && exitReason !== "completed" ? (
          <View style={styles.exitReasonCard}>
            <Text style={styles.exitReasonTitle}>提前结束原因</Text>
            <Text style={styles.exitReasonText}>{exitReasonLabel(exitReason)}</Text>
          </View>
        ) : null}

        <View style={styles.suggestionCard}>
          <Text style={styles.suggestionTitle}>AI 总结</Text>
          <Text style={styles.suggestionBody}>
            {report?.summary ?? finishMessage ?? "你完成了一次以轻松和可持续为目标的聊天跑。"}
          </Text>
          <Text style={styles.nextTitle}>下次建议</Text>
          <Text style={styles.suggestionBody}>{suggestion}</Text>
        </View>

        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>帮我们判断 v0.2 是否成立</Text>
          <Text style={styles.feedbackQuestion}>你是否理解：二区/轻松有氧大概是“能说完整句但不能唱歌”？</Text>
          <OptionRow
            value={zone2Understanding}
            options={[
              ["correct", "理解了"],
              ["unsure", "不确定"],
              ["incorrect", "没理解"]
            ]}
            onChange={setZone2Understanding}
          />

          <Text style={styles.feedbackQuestion}>跑中说话测试对你控制强度有帮助吗？</Text>
          <OptionRow
            value={helpfulness}
            options={[
              ["yes", "有帮助"],
              ["somewhat", "有一点"],
              ["no", "没有"]
            ]}
            onChange={(value) => {
              setHelpfulness(value);
              setVoiceHelpfulness(value);
            }}
          />

          <Text style={styles.feedbackQuestion}>你下次还愿意继续用吗？</Text>
          <OptionRow
            value={nextIntent}
            options={[
              ["yes", "愿意"],
              ["maybe", "可能"],
              ["no", "暂时不"]
            ]}
            onChange={setNextIntent}
          />

          <Text style={styles.feedbackQuestion}>跑完后的整体体感？</Text>
          <OptionRow
            value={finalIntensity}
            options={[
              ["easy", "轻松"],
              ["slightly_breathless", "有点喘"],
              ["too_tired", "太累"]
            ]}
            onChange={setFinalIntensity}
          />

          <Text style={styles.feedbackQuestion}>你还想试真人陪跑吗？</Text>
          <OptionRow
            value={humanInterest}
            options={[
              ["yes", "想试"],
              ["maybe", "可以看看"],
              ["no", "先不用"]
            ]}
            onChange={setHumanInterest}
          />

          <Text style={styles.feedbackQuestion}>还有什么想补充的吗？</Text>
          <TextInput
            multiline
            value={comment}
            onChangeText={setComment}
            placeholder="例如：语音识别不准 / 说话测试让我慢下来了 / 我更想真人陪跑"
            placeholderTextColor="#9A927E"
            style={styles.commentInput}
          />

          <Pressable
            disabled={!canSubmit || submitState === "submitting"}
            style={[styles.submitButton, (!canSubmit || submitState === "submitting") && styles.submitDisabled]}
            onPress={() => void handleSubmitFeedback()}
          >
            <Text style={styles.submitText}>
              {submitState === "submitted" ? "已提交反馈" : submitState === "submitting" ? "提交中..." : "提交反馈"}
            </Text>
          </Pressable>
          {submitState === "offline" ? <Text style={styles.offlineText}>当前未连接服务端，反馈稍后再提交。</Text> : null}
        </View>
      </View>

      <View style={styles.footer}>
        <Link href="/pre-run" style={styles.primaryButton}>
          下次继续说话测试跑
        </Link>
        <Link href="/" style={styles.secondaryButton}>
          回到首页
        </Link>
      </View>
    </ScrollView>
  );
}

function exitReasonLabel(reason: RunExitReason) {
  switch (reason) {
    case "completed":
      return "正常完成";
    case "too_tired":
      return "太累先停";
    case "not_enough_time":
      return "时间不够";
    case "not_feeling_it":
      return "状态不好";
    case "technical_issue":
      return "技术问题";
  }
}

function OptionRow<T extends string>({
  value,
  options,
  onChange
}: {
  value?: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map(([optionValue, label]) => (
        <Pressable
          key={optionValue}
          style={[styles.optionButton, value === optionValue && styles.optionActive]}
          onPress={() => onChange(optionValue)}
        >
          <Text style={[styles.optionText, value === optionValue && styles.optionTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: 24,
    backgroundColor: "#F3EFE5"
  },
  kicker: {
    color: "#6B7A39",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 28,
    marginBottom: 10
  },
  title: {
    color: "#243126",
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "900"
  },
  subtitle: {
    color: "#61705C",
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
    marginBottom: 24
  },
  statsGrid: {
    gap: 12
  },
  statCard: {
    backgroundColor: "#FFF9EA",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0D6BB"
  },
  statValue: {
    color: "#243126",
    fontSize: 30,
    fontWeight: "900"
  },
  statLabel: {
    color: "#61705C",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4
  },
  exitReasonCard: {
    marginTop: 18,
    backgroundColor: "#FFE6D6",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F2B08B"
  },
  exitReasonTitle: {
    color: "#7A341D",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6
  },
  exitReasonText: {
    color: "#7A341D",
    fontSize: 18,
    fontWeight: "900"
  },
  voiceReportCard: {
    marginTop: 18,
    backgroundColor: "#243126",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#243126"
  },
  suggestionCard: {
    marginTop: 18,
    backgroundColor: "#EDF2D0",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#C9D39A"
  },
  suggestionTitle: {
    color: "#243126",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8
  },
  nextTitle: {
    color: "#243126",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 16
  },
  suggestionBody: {
    color: "#3F4F3C",
    fontSize: 16,
    lineHeight: 24
  },
  feedbackCard: {
    marginTop: 18,
    backgroundColor: "#FFF9EA",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0D6BB"
  },
  feedbackTitle: {
    color: "#243126",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12
  },
  feedbackQuestion: {
    color: "#52604E",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 8
  },
  optionRow: {
    flexDirection: "row",
    gap: 8
  },
  optionButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 11,
    backgroundColor: "#F3EFE5",
    borderWidth: 1,
    borderColor: "#E0D6BB"
  },
  optionActive: {
    backgroundColor: "#243126",
    borderColor: "#243126"
  },
  optionText: {
    color: "#61705C",
    fontWeight: "900"
  },
  optionTextActive: {
    color: "#FFF9EA"
  },
  commentInput: {
    minHeight: 82,
    backgroundColor: "#F3EFE5",
    borderColor: "#E0D6BB",
    borderRadius: 18,
    borderWidth: 1,
    color: "#243126",
    fontSize: 15,
    lineHeight: 22,
    padding: 14,
    textAlignVertical: "top"
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#6B7A39",
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 18
  },
  submitDisabled: {
    opacity: 0.45
  },
  submitText: {
    color: "#FFF9EA",
    fontSize: 16,
    fontWeight: "900"
  },
  offlineText: {
    color: "#A15C2F",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center"
  },
  footer: {
    gap: 12,
    marginTop: 24
  },
  primaryButton: {
    overflow: "hidden",
    textAlign: "center",
    backgroundColor: "#243126",
    color: "#FFF9EA",
    fontSize: 18,
    fontWeight: "900",
    paddingVertical: 17,
    borderRadius: 999
  },
  secondaryButton: {
    textAlign: "center",
    color: "#61705C",
    fontSize: 16,
    fontWeight: "800",
    paddingVertical: 12
  }
});
