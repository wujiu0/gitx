#!/bin/bash

SESSION="wj"
WINDOW="team-custom"
CLAUDE="./cc"

# 初始化通信文件
mkdir -p .claude/team
touch .claude/team/{tasks,done,bugs,review}.md

setup_window() {
  local target="$1"

  tmux new-window -t "$target" -n "$WINDOW"

  # 左侧：leader（pane 0）；右侧纵向切三块
  tmux split-window -h -t "${target}:${WINDOW}"
  tmux split-window -v -t "${target}:${WINDOW}.1"
  tmux split-window -v -t "${target}:${WINDOW}.2"

  # 均分右侧三个 pane 的高度
  tmux select-layout -t "${target}:${WINDOW}" main-vertical

  # 启动各角色
  tmux send-keys -t "${target}:${WINDOW}.0" "${CLAUDE} -n 'team-leader' --agent=team-leader" Enter
  tmux send-keys -t "${target}:${WINDOW}.1" "${CLAUDE} -n 'pm' --agent=pm" Enter
  tmux send-keys -t "${target}:${WINDOW}.2" "${CLAUDE} -n 'developer' --agent=developer" Enter
  tmux send-keys -t "${target}:${WINDOW}.3" "${CLAUDE} -n 'tester' --agent=tester" Enter

  # 标题标注
  tmux select-pane -t "${target}:${WINDOW}.0" -T "👑 Team Leader"
  tmux select-pane -t "${target}:${WINDOW}.1" -T "📋 PM"
  tmux select-pane -t "${target}:${WINDOW}.2" -T "💻 Developer"
  tmux select-pane -t "${target}:${WINDOW}.3" -T "🧪 Tester"

  tmux select-pane -t "${target}:${WINDOW}.0"
}

if [ -n "$TMUX" ]; then
  # 已在 tmux 中，直接在当前 session 新建 window
  setup_window "$(tmux display-message -p '#S')"
else
  # 不在 tmux 中，session 不存在则创建
  if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux new-session -d -s "$SESSION"
  fi
  # 创建 window
  setup_window "$SESSION"
  tmux attach -t "$SESSION"
fi