import {
  classifyTalkTestTranscript,
  getTalkTestPrompt,
  type CoachStyle,
  type RunExitReason,
  type RunFeedbackType,
  type RunMode,
  type TalkTestClassification,
  type TalkTestClassificationResult
} from "@run-chat/shared";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import * as Speech from "expo-speech";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CoachCue } from "../src/features/run/coachEngine";
import { getFeedbackCoachCue, getFinishCue, getOpeningCue, getScheduledCoachCue } from "../src/features/run/coachEngine";
import { feedbackOptions } from "../src/features/run/options";
import {
  createRunSession,
  recordRunEvent,
  recordRunFeedback,
  updateRunSession
} from "../src/lib/api/client";
import { ensureAnonymousUser } from "../src/lib/user/anonymousUser";

type VoiceStatus = "idle" | "speaking" | "listening" | "classifying" | "retry" | "permission_denied" | "unavailable";

type VoiceRound = {
  promptId: string;
  promptTitle: string;
  promptMessage: string;
  transcript: string;
  classification: TalkTestClassification;
  feedbackMessage: string;
};

const demoTranscripts = [
  "我现在感觉还可以，呼吸有点快，但是能完整说话。",
  "我有点喘，说话要停一下。",
  "慢下来以后好多了，可以正常说话。"
];

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function shouldUseMockSpeech() {
  return process.env.EXPO_PUBLIC_MOCK_SPEECH === "1" || process.env.EXPO_PUBLIC_MOCK_SPEECH === "true";
}

export default function RunSessionScreen() {
  const params = useLocalSearchParams<{ mode?: RunMode; coachStyle?: CoachStyle; educationDurationSec?: string }>();
  const coachStyle = params.coachStyle ?? "gentle";
  const mode = params.mode ?? "after_work_reset";
  const educationDurationSec = Number(params.educationDurationSec ?? 0);
  const mockSpeech = shouldUseMockSpeech();

  const [sessionId, setSessionId] = useState<string>();
  const [syncState, setSyncState] = useState<"syncing" | "online" | "offline">("syncing");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [slowdownMoments, setSlowdownMoments] = useState(0);
  const [lastPromptAtSec, setLastPromptAtSec] = useState(0);
  const [quietUntilSec, setQuietUntilSec] = useState<number>();
  const [coachCue, setCoachCue] = useState<CoachCue>(() => getOpeningCue(coachStyle, mode));
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voicePromptCount, setVoicePromptCount] = useState(0);
  const [voiceResponseCount, setVoiceResponseCount] = useState(0);
  const [validTalkTestCount, setValidTalkTestCount] = useState(0);
  const [completeSentenceCount, setCompleteSentenceCount] = useState(0);
  const [sttFailureCount, setSttFailureCount] = useState(0);
  const [riskCueCount, setRiskCueCount] = useState(0);
  const [voiceSlowdownCount, setVoiceSlowdownCount] = useState(0);
  const [manualFallbackCount, setManualFallbackCount] = useState(0);
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastVoiceRound, setLastVoiceRound] = useState<VoiceRound>();

  const activePromptRef = useRef(getTalkTestPrompt(0));
  const recognitionStartedAtRef = useRef<number | undefined>(undefined);
  const mockRoundRef = useRef(0);
  const lastResultRef = useRef("");
  const voicePromptCountRef = useRef(0);
  const voiceResponseCountRef = useRef(0);
  const validTalkTestCountRef = useRef(0);
  const completeSentenceCountRef = useRef(0);
  const sttFailureCountRef = useRef(0);
  const riskCueCountRef = useRef(0);
  const voiceSlowdownCountRef = useRef(0);
  const manualFallbackCountRef = useRef(0);

  const voiceStatusText = useMemo(() => {
    switch (voiceStatus) {
      case "speaking":
        return "AI 正在说话";
      case "listening":
        return "正在听你说话";
      case "classifying":
        return "正在判断强度";
      case "retry":
        return "没有听清，准备重试";
      case "permission_denied":
        return "麦克风权限未开启";
      case "unavailable":
        return "当前设备暂不可用 STT";
      case "idle":
        return "等待下一次说话测试";
    }
  }, [voiceStatus]);

  useSpeechRecognitionEvent("start", () => {
    recognitionStartedAtRef.current = Date.now();
    setVoiceStatus("listening");
    void recordVoiceEvent("voice_record_started", {
      promptId: activePromptRef.current.id,
      elapsedSec
    });
  });

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (!transcript) {
      return;
    }

    lastResultRef.current = transcript;
    setLastTranscript(transcript);

    if (event.isFinal) {
      handleTranscript(transcript, event.results[0]?.confidence);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    setSttFailureCount((current) => current + 1);
    sttFailureCountRef.current += 1;
    setVoiceStatus("retry");
    void recordVoiceEvent("stt_failed", {
      promptId: activePromptRef.current.id,
      reason: event.error,
      message: event.message,
      elapsedSec
    });
  });

  useSpeechRecognitionEvent("end", () => {
    const durationMs = recognitionStartedAtRef.current ? Date.now() - recognitionStartedAtRef.current : 0;
    void recordVoiceEvent("voice_record_finished", {
      promptId: activePromptRef.current.id,
      durationMs,
      elapsedSec
    });
  });

  useEffect(() => {
    let isMounted = true;

    ensureAnonymousUser()
      .then((user) => createRunSession({ mode, coachStyle, userId: user.id }))
      .then((session) => {
        if (!isMounted) {
          return;
        }
        setSessionId(session.id);
        setSyncState("online");
        void recordRunEvent(session.id, {
          type: "zone2_education_viewed",
          payload: { durationSec: educationDurationSec }
        }).catch(() => setSyncState("offline"));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setSyncState("offline");
      });

    void speakCoachLine(getOpeningCue(coachStyle, mode).message);

    return () => {
      isMounted = false;
      void Speech.stop();
      ExpoSpeechRecognitionModule.abort();
    };
  }, [coachStyle, mode]);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSec((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    const nextCue = getScheduledCoachCue({
      style: coachStyle,
      mode,
      elapsedSec,
      lastPromptAtSec,
      quietUntilSec,
      feedbackCount
    });

    if (!nextCue) {
      return;
    }

    setCoachCue(nextCue);
    setLastPromptAtSec(elapsedSec);

    if (sessionId) {
      void recordRunEvent(sessionId, { type: "prompt", payload: { cue: nextCue, elapsedSec } }).catch(() => {
        setSyncState("offline");
      });
    }

    if (nextCue.requiresResponse) {
      void startTalkTest();
    } else {
      void speakCoachLine(nextCue.message);
    }
  }, [coachStyle, elapsedSec, feedbackCount, lastPromptAtSec, mode, quietUntilSec, sessionId]);

  async function recordVoiceEvent(type: Parameters<typeof recordRunEvent>[1]["type"], payload: Record<string, unknown>) {
    if (!sessionId) {
      return;
    }

    try {
      await recordRunEvent(sessionId, { type, payload });
    } catch {
      setSyncState("offline");
    }
  }

  async function speakCoachLine(message: string) {
    setVoiceStatus("speaking");
    await Speech.stop();

    return new Promise<void>((resolve) => {
      Speech.speak(message, {
        language: "zh-CN",
        rate: 0.92,
        pitch: 1,
        onDone: () => {
          setVoiceStatus("idle");
          resolve();
        },
        onStopped: () => {
          setVoiceStatus("idle");
          resolve();
        },
        onError: () => {
          setVoiceStatus("idle");
          resolve();
        }
      });
    });
  }

  async function startTalkTest(promptIndex = voicePromptCountRef.current) {
    const prompt = getTalkTestPrompt(promptIndex);
    activePromptRef.current = prompt;
    lastResultRef.current = "";

    setVoicePromptCount((current) => current + 1);
    voicePromptCountRef.current += 1;
    setCoachCue({
      phase: "talk_test",
      title: prompt.title,
      message: prompt.message,
      requiresResponse: true,
      nextPromptInSec: 240
    });
    setLastPromptAtSec(elapsedSec);

    await recordVoiceEvent("voice_prompt_played", {
      promptId: prompt.id,
      promptTitle: prompt.title,
      elapsedSec
    });

    await speakCoachLine(prompt.message);

    if (mockSpeech) {
      const transcript = demoTranscripts[mockRoundRef.current % demoTranscripts.length];
      mockRoundRef.current += 1;
      setVoiceStatus("listening");
      await recordVoiceEvent("voice_record_started", { promptId: prompt.id, elapsedSec, mock: true });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await recordVoiceEvent("voice_record_finished", { promptId: prompt.id, durationMs: 500, elapsedSec, mock: true });
      handleTranscript(transcript, 1);
      return;
    }

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      await recordVoiceEvent("mic_permission_result", { granted: permission.granted, status: permission.status, elapsedSec });
      if (!permission.granted) {
        setVoiceStatus("permission_denied");
        return;
      }

      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setVoiceStatus("unavailable");
        await recordVoiceEvent("stt_failed", { promptId: prompt.id, reason: "recognition_unavailable", elapsedSec });
        return;
      }

      setVoiceStatus("listening");
      ExpoSpeechRecognitionModule.start({
        lang: "zh-CN",
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        contextualStrings: ["完整说话", "有点喘", "胸痛", "头晕", "二区", "轻松", "呼吸"],
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 6000,
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1800,
          EXTRA_PROMPT: prompt.message
        }
      });
    } catch (error) {
      setVoiceStatus("retry");
      await recordVoiceEvent("stt_failed", {
        promptId: prompt.id,
        reason: "start_failed",
        message: error instanceof Error ? error.message : String(error),
        elapsedSec
      });
    }
  }

  function handleTranscript(transcript: string, confidence?: number) {
    setVoiceStatus("classifying");
    setLastTranscript(transcript);
    setVoiceResponseCount((current) => current + 1);
    voiceResponseCountRef.current += 1;

    const classification = classifyTalkTestTranscript(transcript);
    const prompt = activePromptRef.current;
    setLastVoiceRound({
      promptId: prompt.id,
      promptTitle: prompt.title,
      promptMessage: prompt.message,
      transcript,
      classification: classification.classification,
      feedbackMessage: classification.feedbackMessage
    });

    if (classification.classification !== "unknown") {
      setValidTalkTestCount((current) => current + 1);
      validTalkTestCountRef.current += 1;
    }

    if (classification.canSpeakInFullSentence) {
      setCompleteSentenceCount((current) => current + 1);
      completeSentenceCountRef.current += 1;
    }

    if (classification.containsRiskSignal) {
      setRiskCueCount((current) => current + 1);
      riskCueCountRef.current += 1;
    }

    if (classification.feedbackType === "slow_down" || classification.feedbackType === "walk_break") {
      setSlowdownMoments((current) => current + 1);
      setVoiceSlowdownCount((current) => current + 1);
      voiceSlowdownCountRef.current += 1;
    }

    setCoachCue({
      phase: classificationToCuePhase(classification),
      title: classification.reportLabel,
      message: classification.feedbackMessage,
      requiresResponse: classification.classification === "unknown" || classification.feedbackType === "slow_down",
      nextPromptInSec: classification.feedbackType === "slow_down" ? 120 : 240
    });

    void recordVoiceEvent("stt_completed", {
      promptId: prompt.id,
      transcript,
      transcriptLength: transcript.length,
      confidence,
      elapsedSec
    });
    void recordVoiceEvent("talk_test_classified", {
      promptId: prompt.id,
      transcript,
      classification: classification.classification,
      feedbackType: classification.feedbackType,
      canSpeakInFullSentence: classification.canSpeakInFullSentence,
      containsRiskSignal: classification.containsRiskSignal,
      matchedKeywords: classification.matchedKeywords,
      elapsedSec
    });
    void recordVoiceEvent("coach_voice_feedback_played", {
      promptId: prompt.id,
      feedbackType: classification.feedbackType,
      classification: classification.classification,
      message: classification.feedbackMessage,
      elapsedSec
    });

    void speakCoachLine(classification.feedbackMessage);
  }

  function classificationToCuePhase(result: TalkTestClassificationResult): CoachCue["phase"] {
    switch (result.feedbackType) {
      case "slow_down":
        return "slowdown";
      case "walk_break":
      case "safety_stop":
        return "walk_break";
      case "retry":
        return "talk_test";
      case "maintain":
      case "slightly_increase_optional":
        return "steady";
    }
  }

  function handlePauseToggle() {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);

    if (sessionId) {
      void Promise.all([
        updateRunSession(sessionId, { status: nextPaused ? "paused" : "active", durationSec: elapsedSec }),
        recordRunEvent(sessionId, {
          type: nextPaused ? "pause" : "resume",
          payload: { elapsedSec }
        })
      ]).catch(() => {
        setSyncState("offline");
      });
    }
  }

  function handleFeedback(feedback: RunFeedbackType) {
    setFeedbackCount((current) => current + 1);
    setManualFallbackCount((current) => current + 1);
    manualFallbackCountRef.current += 1;
    if (feedback === "slightly_breathless" || feedback === "too_tired") {
      setSlowdownMoments((current) => current + 1);
    }
    const nextCue = getFeedbackCoachCue(feedback, { style: coachStyle, elapsedSec });
    setCoachCue(nextCue);
    setLastPromptAtSec(elapsedSec);
    if (nextCue.quietUntilSec) {
      setQuietUntilSec(nextCue.quietUntilSec);
    }

    void speakCoachLine(nextCue.message);

    if (sessionId) {
      void Promise.all([
        recordRunFeedback(sessionId, feedback, elapsedSec),
        recordRunEvent(sessionId, { type: "manual_fallback_used", payload: { fallbackType: feedback, elapsedSec } })
      ]).catch(() => {
        setSyncState("offline");
      });
    }
  }

  async function finishRun(status: "completed" | "abandoned", exitReason: RunExitReason = "completed") {
    const finishCue = getFinishCue(status, elapsedSec, slowdownMoments);
    setCoachCue(finishCue);
    await Speech.stop();
    ExpoSpeechRecognitionModule.abort();

    if (sessionId) {
      try {
        await updateRunSession(sessionId, { status, durationSec: elapsedSec, exitReason });
        await recordRunEvent(sessionId, { type: "end", payload: { status, elapsedSec, exitReason, cue: finishCue } });
      } catch {
        setSyncState("offline");
      }
    }

    router.replace({
      pathname: "/report",
      params: {
        mode,
        sessionId,
        status,
        durationSec: String(elapsedSec),
        feedbackCount: String(feedbackCount),
        slowdownMoments: String(slowdownMoments),
        voicePromptCount: String(voicePromptCountRef.current),
        voiceResponseCount: String(voiceResponseCountRef.current),
        validTalkTestCount: String(validTalkTestCountRef.current),
        completeSentenceCount: String(completeSentenceCountRef.current),
        sttFailureCount: String(sttFailureCountRef.current),
        riskCueCount: String(riskCueCountRef.current),
        voiceSlowdownCount: String(voiceSlowdownCountRef.current),
        manualFallbackCount: String(manualFallbackCountRef.current),
        finishMessage: finishCue.message,
        exitReason
      }
    });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.modeText}>{mode === "after_work_reset" ? "下班解压跑" : "轻松聊天跑"}</Text>
          <Text style={styles.syncText}>
            {syncState === "online" ? "数据已连接" : syncState === "syncing" ? "正在连接数据" : "离线体验中"}
          </Text>
        </View>
        <Pressable onPress={handlePauseToggle} style={styles.pauseButton}>
          <Text style={styles.pauseText}>{isPaused ? "继续" : "暂停"}</Text>
        </Pressable>
      </View>

      <View style={styles.timerWrap}>
        <Text style={styles.timer}>{formatDuration(elapsedSec)}</Text>
        <Text style={styles.timerHint}>目标不是更快，是还能完整说话。</Text>
      </View>

      <View style={styles.coachCard}>
        <Text style={styles.coachLabel}>AI 说话测试 · {coachCue.title}</Text>
        <Text style={styles.coachLine}>{coachCue.message}</Text>
        <Text style={styles.responseHint}>{voiceStatusText}</Text>
      </View>

      <View style={styles.voicePanel}>
        <Text style={styles.voiceTitle}>跑中主任务：开口说一句完整的话</Text>
        <Text style={styles.voiceBody}>系统会根据你能否完整说话，判断现在是刚好、有点喘，还是该慢下来。</Text>
        {lastTranscript ? <Text style={styles.transcript}>刚才听到：{lastTranscript}</Text> : null}
        {lastVoiceRound ? <Text style={styles.classification}>判断：{lastVoiceRound.classification} · {lastVoiceRound.feedbackMessage}</Text> : null}
        <Pressable style={styles.voiceButton} onPress={() => void startTalkTest()}>
          <Text style={styles.voiceButtonText}>{voiceStatus === "listening" ? "正在听，说完会自动判断" : "现在开始说话测试"}</Text>
        </Pressable>
        {voiceStatus === "listening" && !mockSpeech ? (
          <Pressable style={styles.stopListeningButton} onPress={() => ExpoSpeechRecognitionModule.stop()}>
            <Text style={styles.stopListeningText}>我说完了，开始判断</Text>
          </Pressable>
        ) : null}
      </View>

      <View>
        <Text style={styles.feedbackTitle}>语音失败时才用按钮 fallback</Text>
        <View style={styles.feedbackGrid}>
          {feedbackOptions.map((item) => (
            <Pressable key={item.id} style={styles.feedbackButton} onPress={() => handleFeedback(item.id)}>
              <Text style={styles.feedbackText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.voiceStatsRow}>
          <Text style={styles.voiceStat}>说话测试 {voicePromptCount}</Text>
          <Text style={styles.voiceStat}>回应 {voiceResponseCount}</Text>
          <Text style={styles.voiceStat}>完整句 {completeSentenceCount}</Text>
        </View>
        <Pressable style={styles.finishButton} onPress={() => void finishRun("completed", "completed")}>
          <Text style={styles.finishText}>结束并生成语音报告</Text>
        </Pressable>
        <View style={styles.exitGrid}>
          <Pressable style={styles.abandonButton} onPress={() => void finishRun("abandoned", "too_tired")}>
            <Text style={styles.abandonText}>太累先停</Text>
          </Pressable>
          <Pressable style={styles.abandonButton} onPress={() => void finishRun("abandoned", "technical_issue")}>
            <Text style={styles.abandonText}>技术问题</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F3EFE5"
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14
  },
  modeText: {
    color: "#6B7A39",
    fontSize: 16,
    fontWeight: "900"
  },
  syncText: {
    color: "#7F8A76",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  pauseButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A9B288",
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  pauseText: {
    color: "#243126",
    fontWeight: "800"
  },
  timerWrap: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 14
  },
  timer: {
    color: "#243126",
    fontSize: 58,
    fontWeight: "900",
    letterSpacing: -3
  },
  timerHint: {
    color: "#61705C",
    fontSize: 15,
    marginTop: 4
  },
  coachCard: {
    backgroundColor: "#243126",
    borderRadius: 28,
    padding: 20,
    marginBottom: 14
  },
  coachLabel: {
    color: "#B7C46D",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8
  },
  coachLine: {
    color: "#FFF9EA",
    fontSize: 21,
    lineHeight: 30,
    fontWeight: "800"
  },
  responseHint: {
    color: "#DDE7A6",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 12
  },
  voicePanel: {
    backgroundColor: "#EDF2D0",
    borderColor: "#C9D39A",
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14
  },
  voiceTitle: {
    color: "#243126",
    fontSize: 17,
    fontWeight: "900"
  },
  voiceBody: {
    color: "#52604E",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6
  },
  transcript: {
    color: "#243126",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 10
  },
  classification: {
    color: "#6B7A39",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 6
  },
  voiceButton: {
    alignItems: "center",
    backgroundColor: "#6B7A39",
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 12
  },
  voiceButtonText: {
    color: "#FFF9EA",
    fontSize: 16,
    fontWeight: "900"
  },
  stopListeningButton: {
    alignItems: "center",
    borderColor: "#6B7A39",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 12,
    marginTop: 8
  },
  stopListeningText: {
    color: "#6B7A39",
    fontSize: 15,
    fontWeight: "900"
  },
  feedbackTitle: {
    color: "#243126",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10
  },
  feedbackGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  feedbackButton: {
    minWidth: "47%",
    backgroundColor: "#FFF9EA",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D6BB"
  },
  feedbackText: {
    color: "#243126",
    fontSize: 15,
    fontWeight: "900"
  },
  footer: {
    marginTop: "auto",
    paddingTop: 14
  },
  voiceStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  voiceStat: {
    flex: 1,
    textAlign: "center",
    backgroundColor: "#FFF9EA",
    borderRadius: 999,
    color: "#52604E",
    fontSize: 12,
    fontWeight: "900",
    paddingVertical: 8
  },
  finishButton: {
    alignItems: "center",
    backgroundColor: "#243126",
    borderRadius: 999,
    paddingVertical: 15
  },
  finishText: {
    color: "#FFF9EA",
    fontSize: 17,
    fontWeight: "900"
  },
  exitGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  abandonButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFF9EA",
    borderRadius: 18,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#E0D6BB"
  },
  abandonText: {
    color: "#7A341D",
    fontWeight: "900"
  }
});
