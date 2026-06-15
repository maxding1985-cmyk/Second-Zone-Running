import { expect, test } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:4100";

test("completes a v0.2 voice-first talk-test run and records voice metrics", async ({ page, request }) => {
  await page.goto("/");

  await page.getByText("开始聊天跑", { exact: true }).click();
  await expect(page.getByText("今天先学会一件事：跑到还能说完整句。", { exact: true })).toBeVisible();
  await expect(page.getByText(/能说完整句子，但不能舒服唱歌/)).toBeVisible();

  await page.getByText("我理解了，下一步", { exact: true }).click();
  await expect(page.getByText("运动安全提示", { exact: true })).toBeVisible();

  await page.getByText("我知道了，开始跑", { exact: true }).click();
  await expect(page.getByText("数据已连接", { exact: true })).toBeVisible();
  await expect(page.getByText("跑中主任务：开口说一句完整的话", { exact: true })).toBeVisible();

  await page.getByText("现在开始说话测试", { exact: true }).click();
  await expect(page.getByText(/刚才听到：我现在感觉还可以/)).toBeVisible();
  await expect(page.getByText(/判断：target/)).toBeVisible();

  await page.getByText("现在开始说话测试", { exact: true }).click();
  await expect(page.getByText(/判断：breathless/)).toBeVisible();

  await page.getByText("结束并生成语音报告", { exact: true }).click();

  await expect(page.getByText("这次核心是：你有没有开口说话。", { exact: true })).toBeVisible();
  await expect(page.getByText(/语音回应 \/ 说话测试/)).toBeVisible();
  await expect(page.getByText(/按钮 fallback：0 次/)).toBeVisible();

  await page.getByText("理解了", { exact: true }).click();
  await page.getByText("有帮助", { exact: true }).click();
  await page.getByText("愿意", { exact: true }).click();
  await page.getByText("轻松", { exact: true }).click();
  await page.getByText("可以看看", { exact: true }).click();
  await page.getByPlaceholder("例如：语音识别不准 / 说话测试让我慢下来了 / 我更想真人陪跑").fill("v0.2 voice e2e ok");
  await page.getByText("提交反馈", { exact: true }).click();

  await expect(page.getByText("已提交反馈", { exact: true })).toBeVisible();

  const metricsResponse = await request.get(`${apiBaseUrl}/api/admin/metrics`);
  expect(metricsResponse.ok()).toBeTruthy();
  const metrics = await metricsResponse.json();
  expect(metrics.totalSessions).toBeGreaterThanOrEqual(1);
  expect(metrics.completedSessions).toBeGreaterThanOrEqual(1);
  expect(metrics.sessionsWithVoiceResponse).toBeGreaterThanOrEqual(1);
  expect(metrics.totalVoiceResponseEvents).toBeGreaterThanOrEqual(2);
  expect(metrics.postRunFeedbackCount).toBeGreaterThanOrEqual(1);
  expect(metrics.zone2UnderstandingRate).toBeGreaterThan(0);

  const csvResponse = await request.get(`${apiBaseUrl}/api/admin/export.csv`);
  expect(csvResponse.ok()).toBeTruthy();
  const csv = await csvResponse.text();
  expect(csv).toContain("voiceResponseCount");
  expect(csv).toContain("v0.2 voice e2e ok");
});
