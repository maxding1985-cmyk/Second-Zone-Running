export const RUN_MODES = [
  "easy_run",
  "after_work_reset",
  "beginner_slow_run"
] as const;

export const COACH_STYLES = [
  "gentle",
  "light_coach",
  "quiet"
] as const;

export const RUN_FEEDBACK_TYPES = [
  "easy",
  "slightly_breathless",
  "too_tired",
  "quiet_mode"
] as const;

export const TALK_TEST_CLASSIFICATIONS = [
  "too_easy",
  "target",
  "breathless",
  "too_hard",
  "risk",
  "unknown"
] as const;

export const HUMAN_COMPANION_INTEREST = ["yes", "maybe", "no"] as const;

export type RunMode = (typeof RUN_MODES)[number];
export type CoachStyle = (typeof COACH_STYLES)[number];
export type RunFeedbackType = (typeof RUN_FEEDBACK_TYPES)[number];
export type TalkTestClassification = (typeof TALK_TEST_CLASSIFICATIONS)[number];
export type HumanCompanionInterest = (typeof HUMAN_COMPANION_INTEREST)[number];

export type SessionStatus = "active" | "paused" | "completed" | "abandoned";

export type RunExitReason =
  | "completed"
  | "too_tired"
  | "not_enough_time"
  | "not_feeling_it"
  | "technical_issue";

export type AnonymousUser = {
  id: string;
  nickname?: string;
  testerGroup: string;
  createdAt: string;
};

export type RunSession = {
  id: string;
  userId: string;
  mode: RunMode;
  coachStyle: CoachStyle;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  durationSec: number;
  exitReason?: RunExitReason;
};

export type RunEventType =
  | "started"
  | "prompt"
  | "feedback"
  | "pause"
  | "resume"
  | "end"
  | "zone2_education_viewed"
  | "mic_permission_result"
  | "voice_prompt_played"
  | "voice_record_started"
  | "voice_record_finished"
  | "stt_completed"
  | "stt_failed"
  | "talk_test_classified"
  | "coach_voice_feedback_played"
  | "slowdown_cue_accepted"
  | "manual_fallback_used"
  | "post_run_zone2_quiz_answered"
  | "human_companion_interest";

export type RunEvent = {
  id: string;
  sessionId: string;
  type: RunEventType;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type PostRunFeedback = {
  perceivedHelpfulness: "yes" | "somewhat" | "no";
  nextRunIntent: "yes" | "maybe" | "no";
  perceivedIntensity: "easy" | "slightly_breathless" | "too_tired";
  zone2Understanding?: "correct" | "incorrect" | "unsure";
  voiceHelpfulness?: "yes" | "somewhat" | "no";
  humanCompanionInterest?: HumanCompanionInterest;
  comment?: string;
};

export type TalkTestPrompt = {
  id: string;
  title: string;
  message: string;
  expectedResponseSec: number;
};

export type TalkTestClassificationResult = {
  classification: TalkTestClassification;
  feedbackType: "maintain" | "slightly_increase_optional" | "slow_down" | "walk_break" | "safety_stop" | "retry";
  feedbackMessage: string;
  reportLabel: string;
  canSpeakInFullSentence: boolean;
  containsRiskSignal: boolean;
  matchedKeywords: string[];
};

export type VoiceInteractionStats = {
  voicePromptCount: number;
  voiceResponseCount: number;
  validTalkTestCount: number;
  completeSentenceCount: number;
  sttFailureCount: number;
  targetTalkTests: number;
  breathlessTalkTests: number;
  tooHardTalkTests: number;
  riskCueCount: number;
  slowdownCueCount: number;
  manualFallbackCount: number;
};

export type RunReport = {
  sessionId: string;
  durationSec: number;
  feedbackCount: number;
  slowdownMoments: number;
  voiceStats: VoiceInteractionStats;
  exitReason?: RunExitReason;
  summary: string;
  nextSuggestion: string;
};

export const SAFETY_NOTICE =
  "如果出现胸痛、头晕、异常心悸、呼吸困难或快要晕倒，请立即停止运动并寻求专业帮助。本产品仅提供运动陪伴和强度提醒，不提供医疗诊断。";

export const ZONE2_TALK_TEST_EDUCATION = [
  "二区/轻松有氧不是追配速，而是找一个能持续的强度。",
  "最简单的判断：能说完整句子，但不能舒服唱歌。",
  "如果只能挤出几个词、说话要停下来喘，就说明该慢一点。",
  "如果出现胸痛、头晕、异常心悸或呼吸困难，马上停止运动。"
] as const;

export const TALK_TEST_PROMPTS: TalkTestPrompt[] = [
  {
    id: "baseline_feeling",
    title: "基线说话测试",
    message: "用一句完整的话告诉我，你现在跑起来感觉怎么样。",
    expectedResponseSec: 10
  },
  {
    id: "breathing_check",
    title: "呼吸检查",
    message: "描述一下你现在的呼吸：轻松、刚好，还是有点喘。",
    expectedResponseSec: 10
  },
  {
    id: "full_sentence",
    title: "完整句测试",
    message: "请说一句 10 个字以上的话，不用快，正常说就行。",
    expectedResponseSec: 12
  },
  {
    id: "slowdown_recheck",
    title: "降速复测",
    message: "慢下来之后，再用一句完整的话说说你现在的感觉。",
    expectedResponseSec: 10
  },
  {
    id: "finish_reflection",
    title: "结束前总结",
    message: "用一句话总结这次跑步：它是轻松、刚好，还是太累。",
    expectedResponseSec: 10
  }
] as const;

const riskKeywords = [
  "胸痛",
  "胸闷",
  "头晕",
  "眼前发黑",
  "心悸",
  "心慌",
  "恶心",
  "喘不过气",
  "呼吸困难",
  "刺痛",
  "要晕倒",
  "快晕",
  "晕倒"
];

const tooHardKeywords = ["说不完整", "说不了", "说不出话", "太累", "撑不住", "上不来气", "快不行", "非常喘", "很喘"];
const breathlessKeywords = ["有点喘", "有些喘", "喘", "要停一下", "说话要停", "断句", "呼吸很快", "不能完整"];
const tooEasyKeywords = ["可以唱歌", "能唱歌", "很轻松", "非常轻松", "完全不累", "太轻松", "没感觉"];
const targetKeywords = ["能完整说话", "可以完整说话", "能正常说话", "还能说话", "呼吸还稳", "呼吸稳定", "还可以", "刚好", "可控", "舒服"];
const negativeBreathlessKeywords = ["不喘", "没有喘"];

export function classifyTalkTestTranscript(transcript: string): TalkTestClassificationResult {
  const normalized = normalizeTranscript(transcript);
  const matchedRisk = matchKeywords(normalized, riskKeywords);
  if (matchedRisk.length > 0) {
    return buildClassification("risk", matchedRisk);
  }

  const matchedTooHard = matchKeywords(normalized, tooHardKeywords);
  if (matchedTooHard.length > 0) {
    return buildClassification("too_hard", matchedTooHard);
  }

  const matchedTooEasy = matchKeywords(normalized, tooEasyKeywords);
  if (matchedTooEasy.length > 0) {
    return buildClassification("too_easy", matchedTooEasy);
  }

  const matchedTarget = matchKeywords(normalized, targetKeywords);
  if (matchedTarget.length > 0) {
    return buildClassification("target", matchedTarget);
  }

  const matchedBreathless = matchKeywords(normalized, breathlessKeywords);
  const hasNegatedBreathless = matchKeywords(normalized, negativeBreathlessKeywords).length > 0;
  if (matchedBreathless.length > 0 && !hasNegatedBreathless) {
    return buildClassification("breathless", matchedBreathless);
  }

  return buildClassification("unknown", []);
}

export function getTalkTestPrompt(index: number) {
  return TALK_TEST_PROMPTS[index % TALK_TEST_PROMPTS.length];
}

function normalizeTranscript(transcript: string) {
  return transcript.toLowerCase().replace(/\s+/g, "");
}

function matchKeywords(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.includes(keyword));
}

function buildClassification(classification: TalkTestClassification, matchedKeywords: string[]): TalkTestClassificationResult {
  switch (classification) {
    case "too_easy":
      return {
        classification,
        feedbackType: "slightly_increase_optional",
        feedbackMessage: "你现在很轻松。可以继续保持，也可以非常小幅提一点，但今天不追速度。",
        reportLabel: "偏轻松",
        canSpeakInFullSentence: true,
        containsRiskSignal: false,
        matchedKeywords
      };
    case "target":
      return {
        classification,
        feedbackType: "maintain",
        feedbackMessage: "很好，保持这个能完整说话的节奏，不要急着加速。",
        reportLabel: "刚好",
        canSpeakInFullSentence: true,
        containsRiskSignal: false,
        matchedKeywords
      };
    case "breathless":
      return {
        classification,
        feedbackType: "slow_down",
        feedbackMessage: "你现在有点喘了。慢一点、缩短步幅，先回到能完整说话的状态。",
        reportLabel: "偏强",
        canSpeakInFullSentence: false,
        containsRiskSignal: false,
        matchedKeywords
      };
    case "too_hard":
      return {
        classification,
        feedbackType: "walk_break",
        feedbackMessage: "现在先降到走路，等呼吸恢复。今天不需要硬撑。",
        reportLabel: "过强",
        canSpeakInFullSentence: false,
        containsRiskSignal: false,
        matchedKeywords
      };
    case "risk":
      return {
        classification,
        feedbackType: "safety_stop",
        feedbackMessage: "请马上停止运动。如果症状持续，请联系身边的人或寻求专业医疗帮助。",
        reportLabel: "安全风险",
        canSpeakInFullSentence: false,
        containsRiskSignal: true,
        matchedKeywords
      };
    case "unknown":
      return {
        classification,
        feedbackType: "retry",
        feedbackMessage: "我还没判断清楚。我们再做一次：用一句完整的话描述你的呼吸和体感。",
        reportLabel: "未判断",
        canSpeakInFullSentence: false,
        containsRiskSignal: false,
        matchedKeywords
      };
  }
}
