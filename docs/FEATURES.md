# RoleSwitch Features

## ✨ Core Features

### 🎯 Role-Based Task Management
- **Custom Roles**: Create unlimited roles with custom names, colors, descriptions, and icons
- **Rich Icon Library**: Choose from 40+ professionally designed SVG icons across categories:
  - **Work & Productivity**: laptop, code, design, write, research, meeting, gear
  - **Learning & Growth**: learning, book, brain, experiment, lightbulb
  - **Communication**: email, phone, chat, meeting, users
  - **Health & Fitness**: heart, exercise, meditation, coffee
  - **Creative & Design**: music, art, camera, palette, star
  - **Navigation & Actions**: home, settings, search, plus, and more
- **Visual Identity**: Each role has distinct hex colors and scalable icons for instant recognition
- **Role Management**: Easy creation, editing, and deletion through intuitive settings interface

### ⏱️ Anti-Micro-Switching System
- **Session Locking**: Enforced minimum session durations (default 5 minutes, configurable 5-60 minutes)
- **Transition Windows**: Mandatory pause periods between role switches (default 30 seconds, configurable 30-600 seconds)
- **Lock Prevention**: Blocks impulsive task-switching during active session lock periods
- **Smart Timing**: Automatic lock release after minimum duration with visual countdown
- **Visual Feedback**: Clear lock/unlock indicators with remaining time display

### 📊 Real-Time Tracking & Analytics
- **Live Session Tracking**: Real-time duration display with precise timing
- **Session History**: Complete chronological record of all role switches and sessions
- **Daily Summaries**: Today's activity timeline with session durations and timestamps
- **Event Logging**: Detailed tracking of start, switch, and end events with metadata
- **Derived Sessions**: Smart session reconstruction from event logs
- **Export Capabilities**:
  - CSV format for spreadsheet analysis
  - JSON format for programmatic processing
  - Date range filtering
  - Complete session and event data

### 🎨 Visual Experience
- **Side Panel Dashboard**: Persistent left sidebar with compact role cards and quick actions
- **Ribbon Integration**: Clock icon in left ribbon for instant panel access
- **Status Bar Display**: Current role indicator with color-coded status
- **Workspace Border**: Optional colored border overlay (desktop only, configurable opacity)
- **Interactive Modals**:
  - Transition modal with countdown timer
  - Role picker with visual grid selection
  - Note editing interface
- **Responsive Design**: Fully optimized for desktop and mobile interfaces
- **Theme Integration**: Uses Obsidian's CSS variables for seamless theme compatibility

### 📝 Session Notes
- **Session-Specific Notes**: Add contextual notes to any session
- **Note Management**: Create, edit, and delete notes with timestamps
- **Persistent Storage**: Notes saved with session data for future reference
- **Export Integration**: Notes included in all analytics exports
- **Quick Access**: Add notes to current session via command palette

### ⚙️ Customization
- **Timing Configuration**:
  - Minimum session duration (300-3600 seconds)
  - Transition window duration (30-600 seconds)
- **Visual Preferences**:
  - Status bar display toggle
  - Workspace border toggle (desktop only)
  - Border opacity control (0.1-1.0)
- **Role Customization**:
  - Visual role editor with live preview
  - Icon picker with categorized selection
  - Color picker with hex value support
- **Auto-Save**: Automatic data persistence every minute