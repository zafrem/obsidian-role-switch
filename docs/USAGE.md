# Usage Guide

## 📱 Interface Guide

### Side Panel Dashboard
The main interface for RoleSwitch, accessible via the ribbon clock icon:

- **Header**: Plugin branding with gear icon
- **Roles Section**:
  - Compact role cards with icons and colors
  - Active role highlighted with border
  - Lock indicators for active sessions
  - Click to start/switch roles or open dashboard
- **Quick Actions**:
  - Dashboard button (opens settings fallback if modal unavailable)
  - End Session button (when active and unlocked)
- **Current History**:
  - Active session display with real-time duration
  - Role indicator with color and icon
  - Lock status with countdown timer
- **Today's History**:
  - Last 3 sessions with timestamps and durations
  - "Show more" indicator for additional sessions

### Transition Modal
Appears when switching between roles:
- **Countdown Timer**: Visual transition period (default 30 seconds)
- **Role Information**: Target role with icon and color
- **Progress Indicator**: Real-time countdown display
- **Auto-Switch**: Automatically completes transition when timer expires

### Role Picker Modal
For starting new sessions or switching roles:
- **Role Grid**: Visual grid of all available roles
- **Role Cards**: Icons, names, and colors for easy identification
- **Action Context**: Different behavior for "start" vs "switch" operations

## 🎯 Usage Patterns

### Starting Your First Session
1. **Open Side Panel**: Click the clock icon in the ribbon
2. **Select Role**: Click on any role card to start a session
3. **Session Lock**: Plugin automatically locks session for minimum duration
4. **Visual Feedback**: Status bar and optional border show active role
5. **Add Context**: Use **Cmd/Ctrl + P → "Add Note to Current Session"** for context

### Switching Between Tasks
1. **Check Lock Status**: Ensure session is unlocked (no lock icon)
2. **Initiate Switch**: Click different role in side panel
3. **Transition Period**: 30-second countdown provides mental context switching
4. **New Session**: Fresh session starts with new lock period
5. **Event Logging**: All switches automatically tracked

### Ending Sessions
1. **Manual End**: Click "End Session" in side panel or use command
2. **Auto-End**: Sessions end automatically when switching roles
3. **Session Data**: Duration and notes preserved in history
4. **Status Update**: UI updates to show no active session

### Daily Productivity Review
1. **Check History**: Review "Today's History" in side panel
2. **Analyze Patterns**: Look for frequent switches or long focus periods
3. **Export Data**: Use settings to export detailed analytics
4. **Adjust Strategy**: Modify roles, timing, or workflow based on insights

## Advanced Workflows

### Pomodoro Technique
- Set minimum session: 25 minutes (1500 seconds)
- Set transition: 5 minutes (300 seconds)
- Create roles: "Focus", "Break", "Long Break"

### Deep Work Sessions
- Set minimum session: 90 minutes (5400 seconds)
- Set transition: 15 minutes (900 seconds)
- Create roles: "Deep Work", "Admin", "Communication"

### Agile Development
- Set minimum session: 15 minutes (900 seconds)
- Set transition: 2 minutes (120 seconds)
- Create roles: "Coding", "Testing", "Review", "Planning"

## 🔧 Available Commands

Access via Command Palette (**Ctrl/Cmd + P**):

### Core Commands
- **`Open RoleSwitch Panel`**: Opens the side panel dashboard
- **`Start/Resume Role`**: Opens role picker to start a new session
- **`Switch Role`**: Opens role picker to switch from current session (requires active session)
- **`End Current Role`**: Immediately ends the current active session
- **`Add Note to Current Session`**: Opens note editor for current session

### Planned Commands
- **`Open Role Dashboard`**: Full dashboard modal (implementation pending)
- **`Open Analytics`**: Detailed analytics view (implementation pending)

### Ribbon Actions
- **Clock Icon**: Quick access to side panel (same as "Open RoleSwitch Panel")

### Keyboard Shortcuts
Currently no default keyboard shortcuts are assigned. You can assign custom shortcuts to any command via **Settings → Hotkeys → RoleSwitch**.