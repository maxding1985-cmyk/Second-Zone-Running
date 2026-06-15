import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { classifyTalkTestTranscript, getTalkTestPrompt } from "./index";

describe("classifyTalkTestTranscript", () => {
  it("classifies a controlled full-sentence response as target", () => {
    const result = classifyTalkTestTranscript("我现在感觉还可以，呼吸有点快，但是能完整说话。");

    assert.equal(result.classification, "target");
    assert.equal(result.feedbackType, "maintain");
    assert.equal(result.canSpeakInFullSentence, true);
    assert.match(result.feedbackMessage, /保持/);
  });

  it("classifies a singing-level response as too easy", () => {
    const result = classifyTalkTestTranscript("现在很轻松，我甚至可以唱歌。");

    assert.equal(result.classification, "too_easy");
    assert.equal(result.feedbackType, "slightly_increase_optional");
    assert.match(result.feedbackMessage, /小幅/);
  });

  it("classifies breathless speech as breathless", () => {
    const result = classifyTalkTestTranscript("我有点喘，说话要停一下。");

    assert.equal(result.classification, "breathless");
    assert.equal(result.feedbackType, "slow_down");
    assert.equal(result.canSpeakInFullSentence, false);
  });

  it("classifies a too-hard response as walk break", () => {
    const result = classifyTalkTestTranscript("我说不完整，太累了，喘不过来。");

    assert.equal(result.classification, "too_hard");
    assert.equal(result.feedbackType, "walk_break");
    assert.match(result.feedbackMessage, /走路/);
  });

  it("prioritizes safety risk keywords", () => {
    const result = classifyTalkTestTranscript("我有点胸痛和头晕，但是还想继续。");

    assert.equal(result.classification, "risk");
    assert.equal(result.feedbackType, "safety_stop");
    assert.equal(result.containsRiskSignal, true);
    assert.deepEqual(result.matchedKeywords, ["胸痛", "头晕"]);
  });

  it("asks for retry when the transcript is not meaningful", () => {
    const result = classifyTalkTestTranscript("嗯，不知道。");

    assert.equal(result.classification, "unknown");
    assert.equal(result.feedbackType, "retry");
  });
});

describe("getTalkTestPrompt", () => {
  it("cycles through structured talk-test prompts", () => {
    assert.equal(getTalkTestPrompt(0).id, "baseline_feeling");
    assert.equal(getTalkTestPrompt(5).id, "baseline_feeling");
  });
});
