# 跑步聊天 MVP v0.1 发布检查清单

> 创建日期: 2026-06-15  
> 用途: TestFlight / Android APK / Expo 内测前检查

## 0. 发布结论更新

当前 APK 已完成技术出包和点击式流程验证，但不应被视为“语音聊天跑 MVP 已通过”。

发布定位应改为：

```text
Android Preview 技术冒烟包：验证安装、启动、页面流程和报告展示。
```

当前包不能验证：

- 用户是否愿意跑步时说话。
- AI 是否能听懂用户说话并反馈。
- 说话测试是否能帮助控制二区强度。
- 跑中无手操作是否成立。

下一轮发布前必须进入 v0.2 语音优先 MVP。

v0.2 不再沿用本检查清单作为核心验收，新的规划和任务入口为：

- `07-MVP-v0.2二区说话测试假设验证.md`
- `08-MVP-v0.2开发任务清单.md`

---

## 1. 开发检查

- [x] 移动端主流程：开始 -> 跑中 -> 结束 -> 报告
- [x] AI 陪跑状态机：热身、稳定跑、说话测试、降速、安静、结束总结
- [x] 匿名用户 ID
- [x] 跑步 session API
- [x] 跑中事件 API
- [x] 跑后问卷 API
- [x] 运营指标 API
- [x] JSON / CSV 数据导出
- [x] 内测任务页
- [x] 隐私与安全说明页
- [x] API 自动化测试
- [x] 移动端 coach engine 自动化测试

## 2. 本地验证命令

```bash
npm install
npm run typecheck
npm run build
npm test
npm run export:web
```

## 3. 本地运行

```bash
npm run dev:api
npm run dev:mobile
```

真机测试时设置：

```bash
cp apps/mobile/.env.example apps/mobile/.env
# EXPO_PUBLIC_API_URL=http://你的电脑局域网IP:4000
```

## 4. Preview 包

Android 内测 APK：

```bash
npm run build:preview:android
```

iOS TestFlight / 内测构建：

```bash
npm run build:preview:ios
```

> 注意：EAS 构建需要 Expo 账号和项目配置。当前已准备 `eas.json`、`bundleIdentifier`、`android.package`，但尚未实际提交云端构建。

## 5. 发布前人工检查

- [ ] 安全提示在首次跑前可见
- [ ] 跑中反馈按钮足够大
- [ ] 提前结束原因可以正常记录
- [ ] 报告页不展示配速排名
- [ ] 跑后问卷可以提交
- [ ] `/api/admin/metrics` 有数据
- [ ] `/api/admin/export.csv` 可以打开
- [ ] 内测微信群/反馈渠道已准备
