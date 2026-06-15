import type { CoachStyle, RunFeedbackType, RunMode } from "@run-chat/shared";

export type CoachPhase =
  | "opening"
  | "warmup"
  | "steady"
  | "talk_test"
  | "slowdown"
  | "walk_break"
  | "quiet"
  | "finish";

export type CoachCue = {
  phase: CoachPhase;
  title: string;
  message: string;
  requiresResponse?: boolean;
  nextPromptInSec?: number;
};

type ScheduledCueInput = {
  style: CoachStyle;
  mode: RunMode;
  elapsedSec: number;
  lastPromptAtSec: number;
  quietUntilSec?: number;
  feedbackCount: number;
};

type FeedbackCueInput = {
  style: CoachStyle;
  elapsedSec: number;
};

const promptCadenceSec: Record<CoachStyle, number> = {
  gentle: 300,
  light_coach: 240,
  quiet: 420
};

const modeOpening: Record<RunMode, string> = {
  easy_run: "今天我们做轻松跑，不追配速，只找能完整说话的节奏。",
  after_work_reset: "今天先把工作放下，跑慢一点，让身体一点点松开。",
  beginner_slow_run: "新手慢跑允许走跑结合，目标是舒服地完成，而不是硬撑。"
};

const styleOpening: Record<CoachStyle, string> = {
  gentle: "我会温柔提醒你，累了就慢下来。",
  light_coach: "我会像轻教练一样帮你定期检查强度。",
  quiet: "我会少说话，只在关键节点做提醒。"
};

export function getOpeningCue(style: CoachStyle, mode: RunMode): CoachCue {
  return {
    phase: "opening",
    title: "开始聊天跑",
    message: `${modeOpening[mode]}${styleOpening[style]}`,
    nextPromptInSec: style === "quiet" ? 90 : 60
  };
}

export function getScheduledCoachCue(input: ScheduledCueInput): CoachCue | undefined {
  if (input.quietUntilSec && input.elapsedSec < input.quietUntilSec) {
    return undefined;
  }

  if (input.elapsedSec >= 60 && input.lastPromptAtSec < 60) {
    return {
      phase: "warmup",
      title: "热身检查",
      message: getWarmupMessage(input.style, input.mode),
      requiresResponse: true,
      nextPromptInSec: promptCadenceSec[input.style]
    };
  }

  const cadence = promptCadenceSec[input.style];
  if (input.elapsedSec - input.lastPromptAtSec < cadence) {
    return undefined;
  }

  const promptIndex = Math.floor(input.elapsedSec / cadence);
  if (input.feedbackCount === 0 || promptIndex % 2 === 1) {
    return {
      phase: "talk_test",
      title: "说话测试",
      message: getTalkTestMessage(input.style),
      requiresResponse: true,
      nextPromptInSec: cadence
    };
  }

  return {
    phase: "steady",
    title: "稳定跑",
    message: getSteadyMessage(input.style, input.mode),
    nextPromptInSec: cadence
  };
}

export function getFeedbackCoachCue(feedback: RunFeedbackType, input: FeedbackCueInput): CoachCue & { quietUntilSec?: number } {
  switch (feedback) {
    case "easy":
      return {
        phase: "steady",
        title: "状态稳定",
        message: getEasyFeedbackMessage(input.style),
        nextPromptInSec: promptCadenceSec[input.style]
      };
    case "slightly_breathless":
      return {
        phase: "slowdown",
        title: "稍微降速",
        message: getBreathlessMessage(input.style),
        requiresResponse: true,
        nextPromptInSec: 120
      };
    case "too_tired":
      return {
        phase: "walk_break",
        title: "先别硬撑",
        message:
          "先慢走一会儿，今天不需要证明什么。如果有胸痛、头晕、异常心悸、呼吸困难或快要晕倒，请立即停止运动并寻求专业帮助。",
        requiresResponse: true,
        nextPromptInSec: 90
      };
    case "quiet_mode": {
      const quietDuration = input.style === "quiet" ? 600 : 300;
      return {
        phase: "quiet",
        title: "安静模式",
        message: "没问题，我先少说话。你继续按自己的节奏跑，几分钟后我再轻轻提醒你一次。",
        nextPromptInSec: quietDuration,
        quietUntilSec: input.elapsedSec + quietDuration
      };
    }
  }
}

export function getFinishCue(status: "completed" | "abandoned", durationSec: number, slowdownMoments: number): CoachCue {
  const minutes = Math.floor(durationSec / 60);

  if (status === "abandoned") {
    return {
      phase: "finish",
      title: "已记录尝试",
      message: "今天先到这里也可以。能听到身体的反馈，本身就是健康跑的一部分。"
    };
  }

  if (slowdownMoments > 0) {
    return {
      phase: "finish",
      title: "轻松完成",
      message: `你完成了 ${minutes} 分钟聊天跑，而且有 ${slowdownMoments} 次及时慢下来。这个比硬撑更重要。`
    };
  }

  return {
    phase: "finish",
    title: "轻松完成",
    message: `你完成了 ${minutes} 分钟聊天跑。下次继续先保持能完整说话的节奏。`
  };
}

function getWarmupMessage(style: CoachStyle, mode: RunMode) {
  if (mode === "after_work_reset") {
    return "做个小检查：你能说一句“我现在跑得还算轻松”吗？如果说不完整，就再慢一点。";
  }

  if (style === "quiet") {
    return "轻轻检查一下：现在还能完整说一句话吗？";
  }

  return "刚开始先别急，试着说一句：我现在还能轻松说话。能说完，就是好节奏。";
}

function getTalkTestMessage(style: CoachStyle) {
  if (style === "light_coach") {
    return "说话测试：连续说一句完整的话。如果你只能挤出几个词，就把速度降下来。";
  }

  if (style === "quiet") {
    return "小检查：还能完整说话吗？不行就慢一点。";
  }

  return "我们做个说话测试：你现在还能自然说完一句话吗？如果不太行，慢下来就是正确选择。";
}

function getSteadyMessage(style: CoachStyle, mode: RunMode) {
  if (mode === "beginner_slow_run") {
    return "如果觉得累，可以走跑结合。新手跑最重要的是完成一次舒服的体验。";
  }

  if (style === "light_coach") {
    return "节奏保持住。今天的训练价值来自稳定，不来自突然加速。";
  }

  return "保持这个舒服的节奏。慢一点没关系，能持续才是今天的胜利。";
}

function getEasyFeedbackMessage(style: CoachStyle) {
  if (style === "light_coach") {
    return "很好，当前强度可控。不要因为感觉轻松就马上加速，再稳定几分钟。";
  }

  if (style === "quiet") {
    return "很好，继续保持。";
  }

  return "很好，保持这个能说话的节奏，不需要急着加速。";
}

function getBreathlessMessage(style: CoachStyle) {
  if (style === "light_coach") {
    return "你已经有点喘了。现在做一次主动降速，目标是两分钟内回到能完整说话。";
  }

  if (style === "quiet") {
    return "有点喘了，慢一点，先找回完整说话的节奏。";
  }

  return "你现在有点喘了，我们把速度放慢一点，先回到能完整说一句话的状态。";
}
