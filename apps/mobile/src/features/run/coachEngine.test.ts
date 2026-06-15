import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getFeedbackCoachCue,
  getFinishCue,
  getOpeningCue,
  getScheduledCoachCue
} from "./coachEngine";

describe("coachEngine", () => {
  it("creates an opening cue that reflects mode and style", () => {
    const cue = getOpeningCue("quiet", "beginner_slow_run");

    assert.equal(cue.phase, "opening");
    assert.match(cue.message, /新手慢跑/);
    assert.match(cue.message, /少说话/);
  });

  it("prompts for warmup talk test around the first minute", () => {
    const cue = getScheduledCoachCue({
      style: "gentle",
      mode: "after_work_reset",
      elapsedSec: 60,
      lastPromptAtSec: 0,
      feedbackCount: 0
    });

    assert.equal(cue?.phase, "warmup");
    assert.equal(cue?.requiresResponse, true);
  });

  it("does not prompt while quiet mode is active", () => {
    const cue = getScheduledCoachCue({
      style: "gentle",
      mode: "easy_run",
      elapsedSec: 300,
      lastPromptAtSec: 0,
      quietUntilSec: 360,
      feedbackCount: 1
    });

    assert.equal(cue, undefined);
  });

  it("turns breathless feedback into a slowdown cue", () => {
    const cue = getFeedbackCoachCue("slightly_breathless", { style: "light_coach", elapsedSec: 180 });

    assert.equal(cue.phase, "slowdown");
    assert.match(cue.message, /降速/);
  });

  it("sets quiet duration for quiet mode", () => {
    const cue = getFeedbackCoachCue("quiet_mode", { style: "quiet", elapsedSec: 120 });

    assert.equal(cue.phase, "quiet");
    assert.equal(cue.quietUntilSec, 720);
  });

  it("summarizes slowdown moments at finish", () => {
    const cue = getFinishCue("completed", 960, 2);

    assert.equal(cue.phase, "finish");
    assert.match(cue.message, /2 次及时慢下来/);
  });
});
