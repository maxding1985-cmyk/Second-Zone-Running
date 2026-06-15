import { randomUUID } from "node:crypto";

import type {
  AnonymousUser,
  CoachStyle,
  PostRunFeedback,
  RunEvent,
  RunEventType,
  RunExitReason,
  RunMode,
  RunReport,
  RunSession,
  VoiceInteractionStats
} from "@run-chat/shared";

type CreateSessionInput = {
  userId?: string;
  mode: RunMode;
  coachStyle: RunSession["coachStyle"];
};

type CreateEventInput = {
  type: RunEventType;
  payload?: Record<string, unknown>;
};

export type SessionExportRow = RunSession & {
  feedbackCount: number;
  promptCount: number;
  slowdownMoments: number;
  voiceStats: VoiceInteractionStats;
  postRunFeedback?: PostRunFeedback;
};

const users = new Map<string, AnonymousUser>();
const sessions = new Map<string, RunSession>();
const events = new Map<string, RunEvent[]>();
const postRunFeedback = new Map<string, PostRunFeedback>();

export function createAnonymousUser(input: { nickname?: string; testerGroup?: string } = {}): AnonymousUser {
  const user: AnonymousUser = {
    id: randomUUID(),
    nickname: input.nickname,
    testerGroup: input.testerGroup ?? "seed-v0.1",
    createdAt: new Date().toISOString()
  };

  users.set(user.id, user);
  return user;
}

export function getUser(userId: string): AnonymousUser | undefined {
  return users.get(userId);
}

export function createSession(input: CreateSessionInput): RunSession {
  const userId = input.userId ?? createAnonymousUser().id;
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      testerGroup: "external-v0.1",
      createdAt: new Date().toISOString()
    });
  }

  const session: RunSession = {
    id: randomUUID(),
    userId,
    mode: input.mode,
    coachStyle: input.coachStyle,
    status: "active",
    startedAt: new Date().toISOString(),
    durationSec: 0
  };

  sessions.set(session.id, session);
  events.set(session.id, [
    {
      id: randomUUID(),
      sessionId: session.id,
      type: "started",
      createdAt: session.startedAt
    }
  ]);

  return session;
}

export function getSession(sessionId: string): RunSession | undefined {
  return sessions.get(sessionId);
}

export function updateSession(
  sessionId: string,
  patch: Partial<Pick<RunSession, "status" | "durationSec" | "endedAt" | "exitReason">>
) {
  const session = sessions.get(sessionId);
  if (!session) {
    return undefined;
  }

  const updated = { ...session, ...patch };
  sessions.set(sessionId, updated);
  return updated;
}

export function addEvent(sessionId: string, input: CreateEventInput): RunEvent | undefined {
  if (!sessions.has(sessionId)) {
    return undefined;
  }

  const event: RunEvent = {
    id: randomUUID(),
    sessionId,
    type: input.type,
    payload: input.payload,
    createdAt: new Date().toISOString()
  };

  events.set(sessionId, [...(events.get(sessionId) ?? []), event]);
  return event;
}

export function savePostRunFeedback(sessionId: string, feedback: PostRunFeedback) {
  if (!sessions.has(sessionId)) {
    return undefined;
  }

  postRunFeedback.set(sessionId, feedback);
  return feedback;
}

export function buildReport(sessionId: string): RunReport | undefined {
  const session = sessions.get(sessionId);
  if (!session) {
    return undefined;
  }

  const sessionEvents = events.get(sessionId) ?? [];
  const feedbackEvents = sessionEvents.filter((event) => event.type === "feedback");
  const endEvent = [...sessionEvents].reverse().find((event) => event.type === "end");
  const slowdownMoments = countSlowdownMoments(feedbackEvents);
  const voiceStats = buildVoiceStats(sessionEvents);

  return {
    sessionId,
    durationSec: session.durationSec,
    feedbackCount: feedbackEvents.length,
    slowdownMoments,
    voiceStats,
    exitReason: session.exitReason,
    summary: getEndCueMessage(endEvent) ?? buildReportSummary(session, slowdownMoments, voiceStats),
    nextSuggestion: buildNextSuggestion(session, feedbackEvents.length, slowdownMoments, voiceStats)
  };
}

export function getMetrics() {
  const rows = getSessionExportRows();
  const totalSessions = rows.length;
  const completedSessions = rows.filter((row) => row.status === "completed").length;
  const abandonedSessions = rows.filter((row) => row.status === "abandoned").length;
  const completed15MinSessions = rows.filter((row) => row.status === "completed" && row.durationSec >= 900).length;
  const sessionsWith3Feedback = rows.filter((row) => row.feedbackCount >= 3).length;
  const sessionsWithVoiceResponse = rows.filter((row) => row.voiceStats.voiceResponseCount >= 1).length;
  const sessionsWith3VoiceResponses = rows.filter((row) => row.voiceStats.voiceResponseCount >= 3).length;
  const sessionsWithValidTalkTest = rows.filter((row) => row.voiceStats.validTalkTestCount >= 1).length;
  const feedbackResponses = rows.flatMap((row) => (row.postRunFeedback ? [row.postRunFeedback] : []));
  const helpfulResponses = feedbackResponses.filter((feedback) =>
    feedback.perceivedHelpfulness === "yes" || feedback.perceivedHelpfulness === "somewhat"
  ).length;
  const voiceHelpfulResponses = feedbackResponses.filter((feedback) =>
    feedback.voiceHelpfulness === "yes" || feedback.voiceHelpfulness === "somewhat"
  ).length;
  const zone2CorrectResponses = feedbackResponses.filter((feedback) => feedback.zone2Understanding === "correct").length;
  const humanCompanionInterested = feedbackResponses.filter((feedback) =>
    feedback.humanCompanionInterest === "yes" || feedback.humanCompanionInterest === "maybe"
  ).length;
  const positiveNextRun = feedbackResponses.filter((feedback) => feedback.nextRunIntent === "yes" || feedback.nextRunIntent === "maybe").length;
  const totalDurationSec = rows.reduce((sum, row) => sum + row.durationSec, 0);
  const totalVoicePromptEvents = rows.reduce((sum, row) => sum + row.voiceStats.voicePromptCount, 0);
  const totalVoiceResponseEvents = rows.reduce((sum, row) => sum + row.voiceStats.voiceResponseCount, 0);
  const totalValidTalkTests = rows.reduce((sum, row) => sum + row.voiceStats.validTalkTestCount, 0);
  const totalSttFailures = rows.reduce((sum, row) => sum + row.voiceStats.sttFailureCount, 0);

  return {
    totalUsers: users.size,
    totalSessions,
    completedSessions,
    abandonedSessions,
    completionRate: rate(completedSessions, totalSessions),
    completed15MinSessions,
    completed15MinRate: rate(completed15MinSessions, totalSessions),
    sessionsWith3Feedback,
    feedbackParticipationRate: rate(sessionsWith3Feedback, totalSessions),
    sessionsWithVoiceResponse,
    voiceOpenRate: rate(sessionsWithVoiceResponse, totalSessions),
    sessionsWith3VoiceResponses,
    voiceMultiRoundRate: rate(sessionsWith3VoiceResponses, totalSessions),
    sessionsWithValidTalkTest,
    validTalkTestRate: rate(sessionsWithValidTalkTest, totalSessions),
    totalFeedbackEvents: rows.reduce((sum, row) => sum + row.feedbackCount, 0),
    totalPromptEvents: rows.reduce((sum, row) => sum + row.promptCount, 0),
    totalVoicePromptEvents,
    totalVoiceResponseEvents,
    totalValidTalkTests,
    totalSttFailures,
    sttUsableRate: rate(totalVoiceResponseEvents, totalVoiceResponseEvents + totalSttFailures),
    postRunFeedbackCount: feedbackResponses.length,
    helpfulResponses,
    helpfulRate: rate(helpfulResponses, feedbackResponses.length),
    voiceHelpfulResponses,
    voiceHelpfulRate: rate(voiceHelpfulResponses, feedbackResponses.length),
    zone2CorrectResponses,
    zone2UnderstandingRate: rate(zone2CorrectResponses, feedbackResponses.length),
    humanCompanionInterested,
    humanCompanionInterestRate: rate(humanCompanionInterested, feedbackResponses.length),
    positiveNextRun,
    positiveNextRunRate: rate(positiveNextRun, feedbackResponses.length),
    averageDurationSec: totalSessions > 0 ? Math.round(totalDurationSec / totalSessions) : 0,
    modeBreakdown: countBy(rows.map((row) => row.mode)),
    coachStyleBreakdown: countBy(rows.map((row) => row.coachStyle)),
    exitReasonBreakdown: countBy(rows.map((row) => row.exitReason ?? (row.status === "completed" ? "completed" : "unknown")))
  };
}

export function getSessionExportRows(): SessionExportRow[] {
  return [...sessions.values()].map((session) => {
    const sessionEvents = events.get(session.id) ?? [];
    const feedbackEvents = sessionEvents.filter((event) => event.type === "feedback");

    return {
      ...session,
      feedbackCount: feedbackEvents.length,
      promptCount: sessionEvents.filter((event) => event.type === "prompt").length,
      slowdownMoments: countSlowdownMoments(feedbackEvents),
      voiceStats: buildVoiceStats(sessionEvents),
      postRunFeedback: postRunFeedback.get(session.id)
    };
  });
}

export function getExportData() {
  return {
    exportedAt: new Date().toISOString(),
    metrics: getMetrics(),
    users: [...users.values()],
    sessions: getSessionExportRows(),
    events: [...events.entries()].map(([sessionId, sessionEvents]) => ({ sessionId, events: sessionEvents }))
  };
}

export function getExportCsv() {
  const headers = [
    "sessionId",
    "userId",
    "mode",
    "coachStyle",
    "status",
    "durationSec",
    "feedbackCount",
    "promptCount",
    "slowdownMoments",
    "voicePromptCount",
    "voiceResponseCount",
    "validTalkTestCount",
    "completeSentenceCount",
    "sttFailureCount",
    "riskCueCount",
    "voiceSlowdownCueCount",
    "manualFallbackCount",
    "exitReason",
    "helpfulness",
    "nextRunIntent",
    "perceivedIntensity",
    "zone2Understanding",
    "voiceHelpfulness",
    "humanCompanionInterest",
    "comment",
    "startedAt",
    "endedAt"
  ];

  const lines = getSessionExportRows().map((row) =>
    [
      row.id,
      row.userId,
      row.mode,
      row.coachStyle,
      row.status,
      row.durationSec,
      row.feedbackCount,
      row.promptCount,
      row.slowdownMoments,
      row.voiceStats.voicePromptCount,
      row.voiceStats.voiceResponseCount,
      row.voiceStats.validTalkTestCount,
      row.voiceStats.completeSentenceCount,
      row.voiceStats.sttFailureCount,
      row.voiceStats.riskCueCount,
      row.voiceStats.slowdownCueCount,
      row.voiceStats.manualFallbackCount,
      row.exitReason ?? "",
      row.postRunFeedback?.perceivedHelpfulness ?? "",
      row.postRunFeedback?.nextRunIntent ?? "",
      row.postRunFeedback?.perceivedIntensity ?? "",
      row.postRunFeedback?.zone2Understanding ?? "",
      row.postRunFeedback?.voiceHelpfulness ?? "",
      row.postRunFeedback?.humanCompanionInterest ?? "",
      row.postRunFeedback?.comment ?? "",
      row.startedAt,
      row.endedAt ?? ""
    ]
      .map(csvCell)
      .join(",")
  );

  return `${headers.join(",")}\n${lines.join("\n")}`;
}

function buildVoiceStats(sessionEvents: RunEvent[]): VoiceInteractionStats {
  const classificationEvents = sessionEvents.filter((event) => event.type === "talk_test_classified");
  const feedbackEvents = sessionEvents.filter((event) => event.type === "coach_voice_feedback_played");

  return {
    voicePromptCount: sessionEvents.filter((event) => event.type === "voice_prompt_played").length,
    voiceResponseCount: sessionEvents.filter((event) => event.type === "stt_completed").length,
    validTalkTestCount: classificationEvents.filter((event) => event.payload?.classification !== "unknown").length,
    completeSentenceCount: classificationEvents.filter((event) => event.payload?.canSpeakInFullSentence === true).length,
    sttFailureCount: sessionEvents.filter((event) => event.type === "stt_failed").length,
    targetTalkTests: classificationEvents.filter((event) => event.payload?.classification === "target").length,
    breathlessTalkTests: classificationEvents.filter((event) => event.payload?.classification === "breathless").length,
    tooHardTalkTests: classificationEvents.filter((event) => event.payload?.classification === "too_hard").length,
    riskCueCount: classificationEvents.filter((event) => event.payload?.classification === "risk").length,
    slowdownCueCount: feedbackEvents.filter(
      (event) => event.payload?.feedbackType === "slow_down" || event.payload?.feedbackType === "walk_break"
    ).length,
    manualFallbackCount: sessionEvents.filter((event) => event.type === "manual_fallback_used").length
  };
}

function countSlowdownMoments(feedbackEvents: RunEvent[]) {
  return feedbackEvents.filter((event) => {
    const feedback = event.payload?.feedback;
    return feedback === "slightly_breathless" || feedback === "too_tired";
  }).length;
}

function getEndCueMessage(endEvent?: RunEvent) {
  return typeof endEvent?.payload?.cue === "object" &&
    endEvent.payload.cue !== null &&
    "message" in endEvent.payload.cue &&
    typeof endEvent.payload.cue.message === "string"
    ? endEvent.payload.cue.message
    : undefined;
}

function buildReportSummary(session: RunSession, slowdownMoments: number, voiceStats: VoiceInteractionStats) {
  if (session.status === "abandoned") {
    return "今天先停下来也可以。能识别身体反馈，本身就是健康跑的一部分。";
  }

  if (voiceStats.voiceResponseCount === 0) {
    return "这次还没有完成语音说话测试，因此不能作为核心 MVP 有效样本。";
  }

  if (voiceStats.completeSentenceCount > 0) {
    return `你完成了 ${voiceStats.voiceResponseCount} 次语音回应，其中 ${voiceStats.completeSentenceCount} 次能完整说话。`;
  }

  if (slowdownMoments > 0) {
    return `你完成了一次轻松跑，并且有 ${slowdownMoments} 次及时慢下来。这个比硬撑更重要。`;
  }

  return "你完成了一次以轻松和可持续为目标的聊天跑。";
}

function buildNextSuggestion(session: RunSession, feedbackCount: number, slowdownMoments: number, voiceStats: VoiceInteractionStats) {
  if (session.status === "abandoned") {
    return "下次先从 8-12 分钟开始，允许走跑结合，重点是舒服完成。";
  }

  if (voiceStats.riskCueCount > 0) {
    return "本次出现安全风险信号。下次运动前请先确认身体状态，必要时咨询专业人士。";
  }

  if (voiceStats.voiceResponseCount < 3) {
    return "下次请至少完成 3 次说话测试，这才是 v0.2 的核心验证。";
  }

  if (slowdownMoments >= 2) {
    return "下次开跑前再慢一点，把目标放在 15 分钟稳定可聊天，而不是更快。";
  }

  if (feedbackCount < 3) {
    return "下次继续 15-20 分钟轻松跑，并尝试完成至少 3 次体感反馈。";
  }

  return "下次继续做 15-20 分钟轻松跑，先保持能完整说话的节奏。";
}

function rate(part: number, total: number) {
  return total > 0 ? Number((part / total).toFixed(4)) : 0;
}

function countBy(values: Array<string | undefined>) {
  return values.reduce<Record<string, number>>((acc, value) => {
    const key = value ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}
