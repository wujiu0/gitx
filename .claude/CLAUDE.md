# suidz CLAUDE.md

> 本文件定义 **suidz tmux 多代理工作流**的通用规范。
> 在任何项目中引入此文件后，所有 Claude 实例均遵循相同协作协议。

## 项目配置

```
PROJECT_WINDOW = gitx   # tmux window 1 的名称，与项目名保持一致
```

> 本项目的 `PROJECT_WINDOW` 值请在此处填写，其余规范无需修改。
> 文档中所有 `<PROJECT_WINDOW>` 占位符均指代该值。

---

## 一、角色与 Pane 映射

### \<PROJECT_WINDOW\> window（window 1，3 panes）

| Pane  | tmux 地址                    | 角色            | 职责                                               |
| ----- | ---------------------------- | --------------- | -------------------------------------------------- |
| pane0 | `wj:<PROJECT_WINDOW>.0`      | Team Lead + PM  | 任务规划、需求分解、协调分工、代码提交              |
| pane1 | `wj:<PROJECT_WINDOW>.1`      | 开发代理        | 接收 leader 派发的编码任务，执行并主动汇报          |
| pane2 | `wj:<PROJECT_WINDOW>.2`      | 测试代理        | 代码审查、接口验证、输出测试报告，不启动服务        |

### server window（window 2，2 panes）

| Pane  | tmux 地址         | 用途     |
| ----- | ----------------- | -------- |
| pane0 | `wj:server.0`     | 后端服务 |
| pane1 | `wj:server.1`     | 前端服务 |

> **服务启停命令由各项目自行在 `docs/worklog/leader.md` 中维护。**
> 所有服务统一由 server window 管理，任何代理均不得在其他 pane 自行启动服务。

---

## 二、跨 Pane 通信规范

### 发送消息

```bash
tmux send-keys -t wj:<PROJECT_WINDOW>.<N> '消息内容' Enter
```

多行消息正常工作；向 Claude Code pane 发消息后**必须额外执行一次**：

```bash
tmux send-keys -t wj:<PROJECT_WINDOW>.<N> '' Enter
```

随后用 `tmux capture-pane -pt wj:<PROJECT_WINDOW>.<N>` 校验消息已被接收。

### 操作 server window

```bash
# 停止服务
tmux send-keys -t wj:server.0 C-c    # 后端
tmux send-keys -t wj:server.1 C-c    # 前端

# 启动服务（命令以项目实际为准）
tmux send-keys -t wj:server.0 '<启动命令>' Enter
tmux send-keys -t wj:server.1 '<启动命令>' Enter
```

代码改动涉及后端时，**代理应主动重启后端服务**使改动生效，无需等 leader 指示。

---

## 三、任务流转规范

```
leader 派发任务
      ↓
  开发代理执行
      ↓ 完成后主动汇报 leader（pane0）
  leader review
      ↓
  派发测试代理（pane2）
      ↓ 完成后主动汇报 leader（pane0）
  leader 确认 → git commit
```

### 具体规则

1. **开发完成 → 汇报 leader**
   pane1 完成编码后，通过 `tmux send-keys -t wj:<PROJECT_WINDOW>.0` 发送改动摘要，**不等 leader 来问**。

2. **leader 审查 → 派发测试**
   pane0 review 代码后，通过 `tmux send-keys -t wj:<PROJECT_WINDOW>.2` 下发测试任务。

3. **测试完成 → 汇报 leader**
   pane2 完成后，通过 `tmux send-keys -t wj:<PROJECT_WINDOW>.0` 发送测试结论，**不等 leader 来问**。

4. **leader 提交**
   确认测试通过后，由 pane0 执行 `git commit`。

> **核心原则**：每个环节完成后**主动推进**，不等上一级来拉。

---

## 四、工作台文件（docs/worklog/）

每个代理维护独立的工作台文件，用于记录当前任务状态。

| 文件                        | 维护者        |
| --------------------------- | ------------- |
| `docs/worklog/leader.md`    | pane0 leader  |
| `docs/worklog/dev.md`       | pane1 开发    |
| `docs/worklog/tester.md`    | pane2 测试    |

### 统一格式（必须遵守）

```markdown
# {角色}工作台

## 当前进行中
{正在做的任务名称 + 进度}，无任务时写"无"

## 任务列表

| 任务 | 状态 | 关键信息 |
| ---- | ---- | -------- |
| xxx  | ✅   | ...      |
```

**状态枚举**：`✅ 完成` / `🔄 进行中` / `⏳ 待开始`

### 更新时机

| 时机         | 动作                                      |
| ------------ | ----------------------------------------- |
| 接到任务     | 立即更新「当前进行中」                    |
| 完成任务     | 清空「当前进行中」，任务列表改为 ✅       |
| 任务受阻     | 在「当前进行中」注明阻塞原因              |

保持简洁，**不堆砌大段文字**。

---

## 五、Memory 使用规范

- 多个 pane 共享同一个 memory 目录（`.claude/memory/`）
- memory 中**只记录共享信息**：项目约定、API 规范、工作流规范、技术决策等
- **不记录**具体角色归属、临时任务状态（这些写入工作台文件）
- 各代理读取 memory 时不应假设内容由自己写入

---

## 六、启动 Claude Code 的命令

在 tmux pane 中启动 Claude Code 时，**必须使用 `cc` 命令**，不得使用 `claude`：

```bash
tmux send-keys -t wj:<PROJECT_WINDOW>.<N> 'cc' Enter
```

`cc` 是全局别名，内含必要的启动参数。

---

## 七、新项目接入 Checklist

在新项目中启用此工作流时，leader（pane0）负责完成以下初始化：

- [ ] 创建 `docs/worklog/` 目录及三个工作台文件
- [ ] 在 `leader.md` 中记录本项目的服务启动命令
- [ ] 确认 tmux session `wj` 已启动，`<PROJECT_WINDOW>` 和 `server` 两个 window 布局正确
- [ ] 向 pane1、pane2 发送角色说明，确认各代理已读取本 CLAUDE.md

---

## 八、各角色速查

### pane0 · Team Lead

```
收到需求 → 拆解任务 → send-keys 派发给 pane1
等待 pane1 汇报 → review 代码 → send-keys 派发给 pane2
等待 pane2 汇报 → 确认无误 → git commit
```

### pane1 · 开发代理

```
收到任务 → 更新 dev.md「当前进行中」
→ 编码实现
→ 若涉及后端改动：重启 wj:server.0
→ 完成后：更新 dev.md（清空进行中 + ✅）
→ send-keys 汇报 pane0（附改动摘要）
```

### pane2 · 测试代理

```
收到任务 → 更新 tester.md「当前进行中」
→ 代码审查 + 接口验证（不启动服务，只调用）
→ 完成后：更新 tester.md（清空进行中 + ✅）
→ send-keys 汇报 pane0（附测试结论：通过 / 问题列表）
```