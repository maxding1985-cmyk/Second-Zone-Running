# 跑步聊天

AI + 真人混合式二区语音陪跑产品 MVP。

## 当前阶段

MVP v0.2：语音优先的二区说话测试验证版。当前核心不是继续优化点击按钮流程，而是验证用户跑步时是否愿意开口说话，以及 AI 能否通过说话测试帮助用户保持轻松有氧/二区训练强度。

关键规划文档：

- `/Users/user/Documents/跑步聊天/prd/P001-跑步聊天/07-MVP-v0.2二区说话测试假设验证.md`
- `/Users/user/Documents/跑步聊天/prd/P001-跑步聊天/08-MVP-v0.2开发任务清单.md`

## 项目结构

```text
apps/
  mobile/        # React Native + Expo App
  api/           # Node.js + TypeScript API
packages/
  shared/        # Shared domain types and constants
prd/
  P001-跑步聊天/  # Product planning and research docs
```

## 本地启动

```bash
npm install
npm run dev:api
npm run dev:mobile
```

移动端默认请求 `http://127.0.0.1:4000`。如果用真机测试，请复制环境变量文件并改成电脑的局域网 IP：

```bash
cp apps/mobile/.env.example apps/mobile/.env
# EXPO_PUBLIC_API_URL=http://你的电脑局域网IP:4000
```

Android Emulator 通常使用：

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
```

## 常用命令

```bash
npm run dev:mobile      # 启动 Expo
npm run dev:api         # 启动 API
npm run typecheck       # 全仓库类型检查
npm run build           # 构建可构建的 workspace
npm test                # 运行 API + 移动端逻辑测试
npm run export:web      # 导出 Expo Web 预览
npm run test:e2e        # 运行端到端自动化测试
```

## 端到端测试

`npm run test:e2e` 会自动启动测试 API（`127.0.0.1:4100`），导出并托管 Expo Web（`127.0.0.1:4173`），然后用 Playwright 跑通：

```text
首页 -> 开始聊天跑 -> 安全确认 -> 跑中反馈 -> 生成报告 -> 提交跑后反馈 -> 校验运营指标
```

首次运行如果本机还没有 Playwright 浏览器，请先执行：

```bash
npx playwright install chromium
```

## MVP v0.1 已有闭环

- 当前 v0.1 已重新定位为“点击式流程原型 / 技术冒烟包”，不能代表真正的语音聊天跑 MVP。
- 用户选择跑步场景和 AI 陪跑风格。
- App 创建或复用匿名内测用户 ID。
- 用户确认运动安全提示后开始聊天跑。
- 移动端创建后端跑步 session；API 不可用时可离线体验。
- 跑中记录“轻松 / 有点喘 / 太累 / 安静一会儿”反馈和提前结束原因。
- AI 陪跑状态机会在热身、稳定跑、说话测试、降速、慢走/暂停、安静模式之间切换。
- 结束后更新 session 并生成跑后报告。
- 跑后收集“是否有帮助 / 是否愿意下次继续 / 整体体感 / 文字补充”。
- 内测看板展示完成率、反馈参与率、主观有效率和复用意愿。

## API 端点

| Method | Path | 用途 |
|--------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/users/anonymous` | 创建匿名内测用户 |
| POST | `/api/sessions` | 创建跑步 session |
| GET | `/api/sessions/:id` | 获取跑步 session |
| PATCH | `/api/sessions/:id` | 更新跑步 session |
| POST | `/api/sessions/:id/events` | 记录跑中事件 |
| POST | `/api/sessions/:id/feedback` | 提交跑后反馈 |
| GET | `/api/sessions/:id/report` | 获取跑后报告 |
| GET | `/api/admin/metrics` | 查看内测核心指标 |
| GET | `/api/admin/sessions` | 查看内测会话列表 |
| GET | `/api/admin/export.json` | 导出 JSON 内测数据 |
| GET | `/api/admin/export.csv` | 导出 CSV 内测数据 |

## 注意

当前项目已在 `.node-version` / `.nvmrc` 固定为 Node `26.3.0`。React Native 依赖支持的范围是 `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`，不要使用 `v24.2.0` 这类不满足范围的版本。
