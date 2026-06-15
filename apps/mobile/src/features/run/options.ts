import type { CoachStyle, RunFeedbackType, RunMode } from "@run-chat/shared";

export const runModes: Array<{ id: RunMode; title: string; subtitle: string }> = [
  {
    id: "easy_run",
    title: "轻松跑",
    subtitle: "不拼配速，先找到能完整说话的节奏。"
  },
  {
    id: "after_work_reset",
    title: "下班解压跑",
    subtitle: "把今天放下，用 20 分钟慢慢松开身体。"
  },
  {
    id: "beginner_slow_run",
    title: "新手慢跑",
    subtitle: "允许走跑结合，目标是轻松完成。"
  }
];

export const coachStyles: Array<{ id: CoachStyle; title: string; subtitle: string }> = [
  {
    id: "gentle",
    title: "温柔陪伴",
    subtitle: "少评价，多鼓励，适合恢复和解压。"
  },
  {
    id: "light_coach",
    title: "轻教练",
    subtitle: "适度提醒节奏，帮你别跑太猛。"
  },
  {
    id: "quiet",
    title: "少说话",
    subtitle: "降低打扰，只保留关键说话测试。"
  }
];

export const feedbackOptions: Array<{ id: RunFeedbackType; label: string }> = [
  { id: "easy", label: "轻松" },
  { id: "slightly_breathless", label: "有点喘" },
  { id: "too_tired", label: "太累了" },
  { id: "quiet_mode", label: "安静一会儿" }
];
