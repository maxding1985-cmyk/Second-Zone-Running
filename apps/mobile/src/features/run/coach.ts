import type { CoachStyle, RunFeedbackType, RunMode } from "@run-chat/shared";

import { getFeedbackCoachCue, getOpeningCue, getScheduledCoachCue } from "./coachEngine";

export function getOpeningLine(style: CoachStyle, mode: RunMode = "after_work_reset"): string {
  return getOpeningCue(style, mode).message;
}

export function getFeedbackReply(feedback: RunFeedbackType, style: CoachStyle = "gentle"): string {
  return getFeedbackCoachCue(feedback, { style, elapsedSec: 0 }).message;
}

export function getTimedPrompt(elapsedMinutes: number, style: CoachStyle = "gentle"): string {
  return (
    getScheduledCoachCue({
      style,
      mode: "easy_run",
      elapsedSec: elapsedMinutes * 60,
      lastPromptAtSec: elapsedMinutes <= 1 ? 0 : Math.max(60, elapsedMinutes * 60 - 300),
      feedbackCount: 0
    })?.message ?? "保持这个节奏，今天的目标是轻松完成，不是跑赢谁。"
  );
}
