# TaskSwitch - Obsidian Plugin

A comprehensive task-switching plugin for Obsidian that reduces context-switching cost through enforced transition windows, session tracking, and role-based productivity management.

## Overview

TaskSwitch helps you maintain focus and track productivity by implementing anti-micro-switching mechanisms with customizable roles, visual feedback, and comprehensive analytics.

## ✨ Core Features

### 🎯 Role-Based Task Management
- **Custom Roles**: Create unlimited roles with custom names, colors, and icons
- **Icon Library**: Choose from 40+ professionally designed icons across categories:
  - Work & Productivity (laptop, code, design, write, research, meeting)
  - Learning & Growth (learning, book, brain, experiment)
  - Communication (email, phone, chat, meeting)
  - Health & Fitness (heart, exercise, meditation)
  - Creative & Design (music, art, camera, palette)
  - And many more...
- **Visual Identity**: Each role has distinct colors and icons for instant recognition

### ⏱️ Anti-Micro-Switching System
- **Minimum Session Duration**: Enforced 5-minute minimum sessions (configurable 300-3600s)
- **Transition Windows**: 30-second mandatory pauses between role switches (configurable 30-600s)
- **Session Locking**: Prevents impulsive task-switching during minimum session periods
- **Visual Feedback**: Clear indicators for locked/unlocked session states

### 📊 Real-Time Tracking & Analytics
- **Live Timer**: Real-time session duration display with hours/minutes/seconds
- **Current History**: Shows active session with live-updating duration
- **Today's History**: Chronological timeline of all daily role changes
- **Comprehensive Analytics**: 
  - Session duration analysis
  - Role usage patterns
  - Productivity metrics
  - Date-filtered reporting
  - CSV/JSON export capabilities

### 🎨 Visual Experience
- **Side Panel Dashboard**: Persistent left sidebar panel for quick access
- **Ribbon Icon**: Clock icon in left ribbon for easy panel access
- **Status Bar Integration**: Current role display with icons in status bar
- **Workspace Border**: Optional colored border around workspace (desktop only)
- **Enhanced Modals**: Full-featured role dashboard with visual role selection
- **Mobile Responsive**: Optimized for both desktop and mobile devices

### 📝 Session Notes
- **Contextual Notes**: Add notes to specific sessions
- **Note Management**: Edit, delete, and organize session-specific notes
- **Export Integration**: Notes included in analytics exports

### ⚙️ Customization
- **Flexible Settings**: Configurable session durations and transition times
- **Visual Preferences**: Toggle status bar, borders, and opacity settings
- **Role Management**: Easy role creation, editing, and deletion
- **Icon Selection**: Visual icon picker with organized categories

## 🚀 Getting Started

### Installation
1. Download the latest release files (`main.js`, `manifest.json`, `styles.css`)
2. Place them in your vault's `.obsidian/plugins/taskswitch/` directory
3. Enable the plugin in Obsidian's Community Plugins settings

### First Use
1. **Create Roles**: Go to Settings → TaskSwitch to create your first roles
2. **Choose Icons**: Select icons and colors that represent your different work modes
3. **Configure Timing**: Adjust session and transition durations to match your workflow
4. **Open Dashboard**: Click the clock icon in the ribbon or use Command Palette → "Open TaskSwitch Panel"

## 📱 Interface Guide

### Side Panel Dashboard
- **Current History**: Shows active session with real-time timer
- **Role Selection**: Visual role cards with icons and colors
- **Quick Actions**: One-click access to full dashboard and session end
- **Smart Indicators**: Clear visual feedback for session locks and status

### Full Dashboard Modal
- **Current History**: Detailed session status with live updates
- **Role Grid**: Large visual role selection with hover effects and animations
- **Today's History**: Complete timeline of daily activity with timestamps
- **Quick Actions**: Analytics and settings access

### Settings Panel
- **Role Management** (Top Priority):
  - Visual role list with icons and colors
  - Add/Edit/Delete role functionality
  - Icon picker with 40+ options
- **Session Settings**:
  - Transition duration (30-600 seconds)
  - Minimum session duration (300-3600 seconds)
- **Display Settings**:
  - Status bar toggle
  - Workspace border (desktop)
  - Border opacity control

## 🎯 Usage Patterns

### Focus Sessions
1. Select your focus role (e.g., "Deep Work" with laptop icon)
2. Plugin enforces 5-minute minimum before allowing switches
3. Real-time timer keeps you aware of session progress
4. Add notes during the session for context

### Task Switching
1. When ready to switch (after minimum duration)
2. Click new role in dashboard or side panel
3. 30-second transition window provides mental context switching
4. New session begins with fresh timer

### Daily Review
1. Check "Today's History" in dashboard
2. Review session patterns and durations
3. Export analytics for deeper analysis
4. Adjust roles and timing based on patterns

## 🛠️ Technical Details

### Built With
- **TypeScript**: Full type safety and modern JavaScript features
- **Obsidian API**: Native integration with Obsidian's plugin system
- **SVG Icons**: Scalable vector icons for crisp display at any size
- **CSS Variables**: Theme-compatible styling using Obsidian's color system

### Performance
- **Efficient Timers**: Smart timer management with proper cleanup
- **Memory Optimized**: Minimal memory footprint with event cleanup
- **Mobile Optimized**: Responsive design for touch interfaces
- **Background Processing**: Non-blocking session management

### Data Storage
- **Local Storage**: All data stored locally in Obsidian's plugin data
- **Export Options**: CSV and JSON export for external analysis
- **Privacy Focused**: No external data transmission

## 📈 Analytics & Insights

### Session Analytics
- Total session time by role
- Average session duration
- Session frequency patterns
- Daily/weekly/monthly summaries

### Productivity Metrics
- Context switching frequency
- Focus session consistency
- Role usage distribution
- Time allocation analysis

### Export Capabilities
- **CSV Format**: Spreadsheet-compatible for advanced analysis
- **JSON Format**: Structured data for programmatic processing
- **Date Filtering**: Export specific date ranges
- **Complete Data**: Sessions, notes, and metadata included

## 🎨 Customization Examples

### Role Setup Ideas
- **Deep Work**: Laptop icon, blue color, for focused coding/writing
- **Meetings**: Meeting icon, green color, for collaborative sessions
- **Learning**: Book icon, purple color, for study and research
- **Admin**: Gear icon, gray color, for administrative tasks
- **Break**: Coffee icon, brown color, for rest periods

### Workflow Configurations
- **Pomodoro Style**: 25-minute minimum sessions, 5-minute transitions
- **Deep Work**: 90-minute minimum sessions, 15-minute transitions  
- **Agile Sprint**: 15-minute minimum sessions, 2-minute transitions

## 🔧 Commands

Access these via Command Palette (Ctrl/Cmd + P):

- **Open TaskSwitch Panel**: Opens the side panel dashboard
- **Open Role Dashboard**: Opens the full dashboard modal
- **Start/Resume Role**: Quick role picker for starting sessions
- **Switch Role**: Role picker for switching active sessions
- **End Current Role**: Ends the current session
- **Open Analytics**: Opens detailed analytics view

## 🐛 Troubleshooting

### Common Issues
- **Timer Not Updating**: Refresh the dashboard or reopen the modal
- **Roles Not Saving**: Check Obsidian's plugin data directory permissions
- **Mobile Display Issues**: Ensure latest plugin version for mobile optimizations

### Performance Tips
- **Large History**: Plugin automatically limits history display to improve performance
- **Memory Usage**: Timers are cleaned up when modals close
- **Storage**: Regular analytics exports can help manage data size

## 🤝 Contributing

This plugin is built with extensibility in mind. Key areas for contribution:
- Additional icon sets
- New analytics visualizations  
- Enhanced mobile features
- Integration with other productivity plugins

## 📄 License

MIT License - See LICENSE file for details

## 🏷️ Version

Current Version: 0.1.0
Minimum Obsidian Version: 1.6.0
Mobile Support: Full

---

Built with ❤️ for the Obsidian community. Focus better, switch smarter, achieve more.