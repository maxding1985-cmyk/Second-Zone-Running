import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { buildServer } from "./server.js";

const app = buildServer({ logger: false });

before(async () => {
  await app.ready();
});

after(async () => {
  await app.close();
});

describe("run-chat API", () => {
  it("returns health status", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: "ok", service: "run-chat-api" });
  });

  it("creates an anonymous tester", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/users/anonymous",
      payload: { testerGroup: "api-test" }
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.json().testerGroup, "api-test");
  });

  it("creates a run session, records feedback, and builds a report", async () => {
    const userResponse = await app.inject({ method: "POST", url: "/api/users/anonymous", payload: { testerGroup: "api-test" } });
    const user = userResponse.json();

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/sessions",
      payload: { userId: user.id, mode: "after_work_reset", coachStyle: "gentle" }
    });

    assert.equal(createResponse.statusCode, 201);
    const session = createResponse.json();
    assert.equal(session.status, "active");
    assert.equal(session.userId, user.id);

    const feedbackResponse = await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/events`,
      payload: {
        type: "feedback",
        payload: { feedback: "slightly_breathless", elapsedSec: 120 }
      }
    });
    assert.equal(feedbackResponse.statusCode, 201);

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/api/sessions/${session.id}`,
      payload: { status: "completed", durationSec: 900, exitReason: "completed" }
    });
    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.json().exitReason, "completed");

    const endResponse = await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/events`,
      payload: {
        type: "end",
        payload: { cue: { message: "你完成了 15 分钟聊天跑。" } }
      }
    });
    assert.equal(endResponse.statusCode, 201);

    const reportResponse = await app.inject({ method: "GET", url: `/api/sessions/${session.id}/report` });
    assert.equal(reportResponse.statusCode, 200);
    assert.equal(reportResponse.json().durationSec, 900);
    assert.equal(reportResponse.json().feedbackCount, 1);
    assert.equal(reportResponse.json().slowdownMoments, 1);
    assert.equal(reportResponse.json().voiceStats.voicePromptCount, 0);
    assert.equal(reportResponse.json().summary, "你完成了 15 分钟聊天跑。");
  });

  it("records voice talk-test events and exposes v0.2 voice metrics", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/sessions",
      payload: { mode: "easy_run", coachStyle: "light_coach" }
    });
    const session = createResponse.json();

    await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/events`,
      payload: {
        type: "voice_prompt_played",
        payload: { promptId: "baseline_feeling", elapsedSec: 60 }
      }
    });

    await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/events`,
      payload: {
        type: "stt_completed",
        payload: {
          promptId: "baseline_feeling",
          transcript: "我现在感觉还可以，呼吸有点快，但是能完整说话。",
          transcriptLength: 24,
          confidence: 0.9
        }
      }
    });

    await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/events`,
      payload: {
        type: "talk_test_classified",
        payload: {
          promptId: "baseline_feeling",
          classification: "target",
          feedbackType: "maintain",
          canSpeakInFullSentence: true,
          containsRiskSignal: false
        }
      }
    });

    await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/events`,
      payload: {
        type: "coach_voice_feedback_played",
        payload: { feedbackType: "maintain", classification: "target" }
      }
    });

    await app.inject({
      method: "PATCH",
      url: `/api/sessions/${session.id}`,
      payload: { status: "completed", durationSec: 600, exitReason: "completed" }
    });

    const reportResponse = await app.inject({ method: "GET", url: `/api/sessions/${session.id}/report` });
    assert.equal(reportResponse.statusCode, 200);
    const report = reportResponse.json();
    assert.equal(report.voiceStats.voicePromptCount, 1);
    assert.equal(report.voiceStats.voiceResponseCount, 1);
    assert.equal(report.voiceStats.validTalkTestCount, 1);
    assert.equal(report.voiceStats.completeSentenceCount, 1);
    assert.match(report.summary, /语音回应/);

    const feedbackResponse = await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/feedback`,
      payload: {
        perceivedHelpfulness: "yes",
        nextRunIntent: "maybe",
        perceivedIntensity: "easy",
        zone2Understanding: "correct",
        voiceHelpfulness: "yes",
        humanCompanionInterest: "maybe"
      }
    });
    assert.equal(feedbackResponse.statusCode, 201);

    const metricsResponse = await app.inject({ method: "GET", url: "/api/admin/metrics" });
    assert.equal(metricsResponse.statusCode, 200);
    const metrics = metricsResponse.json();
    assert.ok(metrics.sessionsWithVoiceResponse >= 1);
    assert.ok(metrics.voiceOpenRate > 0);
    assert.ok(metrics.zone2UnderstandingRate > 0);
    assert.ok(metrics.humanCompanionInterestRate > 0);
  });

  it("stores post-run feedback and exposes metrics/export", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/sessions",
      payload: { mode: "easy_run", coachStyle: "quiet" }
    });
    const session = createResponse.json();

    const feedbackResponse = await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/feedback`,
      payload: {
        perceivedHelpfulness: "yes",
        nextRunIntent: "yes",
        perceivedIntensity: "easy",
        comment: "降速提醒有帮助"
      }
    });

    assert.equal(feedbackResponse.statusCode, 201);
    assert.equal(feedbackResponse.json().nextRunIntent, "yes");

    const metricsResponse = await app.inject({ method: "GET", url: "/api/admin/metrics" });
    assert.equal(metricsResponse.statusCode, 200);
    assert.ok(metricsResponse.json().totalSessions >= 1);
    assert.ok("helpfulRate" in metricsResponse.json());

    const csvResponse = await app.inject({ method: "GET", url: "/api/admin/export.csv" });
    assert.equal(csvResponse.statusCode, 200);
    assert.match(csvResponse.body, /sessionId,userId,mode/);
    assert.match(csvResponse.body, /降速提醒有帮助/);

    const jsonResponse = await app.inject({ method: "GET", url: "/api/admin/export.json" });
    assert.equal(jsonResponse.statusCode, 200);
    assert.ok(Array.isArray(jsonResponse.json().sessions));
  });
});
