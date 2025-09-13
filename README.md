# TaskSwitch - Obsidian Plugin

A sophisticated productivity plugin for Obsidian that reduces context-switching costs through enforced session locks, transition windows, and comprehensive role-based task management with real-time tracking and analytics.

## Overview

TaskSwitch transforms how you manage focus and productivity in Obsidian by implementing intelligent anti-micro-switching mechanisms. Create custom roles with distinct visual identities, enforce minimum session durations to prevent impulsive task-switching, and gain deep insights into your work patterns through comprehensive analytics and session tracking.

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

## 🚀 Getting Started

### Installation

#### Manual Installation
1. Download the latest release files:
   - `main.js` (compiled plugin code)
   - `manifest.json` (plugin metadata)
   - `styles.css` (optional styling)
2. Create directory: `<your-vault>/.obsidian/plugins/taskswitch/`
3. Place all files in the created directory
4. Restart Obsidian or reload plugins
5. Enable "TaskSwitch" in **Settings → Community plugins**

#### Development Installation
1. Clone this repository into your vault's plugins folder:
   ```bash
   cd <your-vault>/.obsidian/plugins/
   git clone <repository-url> taskswitch
   cd taskswitch
   ```
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Enable the plugin in Obsidian settings

### Quick Setup
1. **Access Settings**: Go to **Settings → TaskSwitch**
2. **Create Your First Role**: 
   - Click "Add Role"
   - Choose a name (e.g., "Deep Work")
   - Select an icon (e.g., laptop)
   - Pick a color
   - Add optional description
3. **Configure Timing**: Adjust session and transition durations to match your workflow
4. **Open Panel**: Click the clock icon in the ribbon or use **Cmd/Ctrl + P → "Open TaskSwitch Panel"**
5. **Start Your First Session**: Click on your role in the side panel

## 📱 Interface Guide

### Side Panel Dashboard
The main interface for TaskSwitch, accessible via the ribbon clock icon:

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

### Settings Interface
Accessed via **Settings → TaskSwitch**:

#### Role Management
- **Role List**: Visual display of all roles with icons and colors
- **Add Role**: Create new roles with full customization
- **Edit Role**: Modify existing roles (name, icon, color, description)
- **Delete Role**: Remove roles (ends active session if deleting current role)
- **Icon Picker**: Categorized selection of 40+ SVG icons
- **Color Picker**: Hex color selection with live preview

#### Session Configuration
- **Minimum Session Duration**: 300-3600 seconds (5-60 minutes)
- **Transition Duration**: 30-600 seconds (0.5-10 minutes)
- **Real-time Validation**: Settings validated on change

#### Display Options
- **Status Bar**: Toggle current role display in status bar
- **Workspace Border**: Toggle colored border overlay (desktop only)
- **Border Opacity**: Adjust border transparency (0.1-1.0)

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

### Advanced Workflows

#### Pomodoro Technique
- Set minimum session: 25 minutes (1500 seconds)
- Set transition: 5 minutes (300 seconds)
- Create roles: "Focus", "Break", "Long Break"

#### Deep Work Sessions
- Set minimum session: 90 minutes (5400 seconds)
- Set transition: 15 minutes (900 seconds)
- Create roles: "Deep Work", "Admin", "Communication"

#### Agile Development
- Set minimum session: 15 minutes (900 seconds)
- Set transition: 2 minutes (120 seconds)
- Create roles: "Coding", "Testing", "Review", "Planning"

## 🛠️ Technical Details

### Architecture
- **TypeScript**: Full type safety with strict mode enabled
- **Modular Design**: Clean separation of concerns across multiple files:
  - `main.ts`: Plugin lifecycle and core functionality
  - `src/views/`: UI components (SidePanelView, Modals)
  - `src/settings/`: Settings interface and management
  - `src/types.ts`: TypeScript interfaces and type definitions
  - `src/utils.ts`: Utility functions and helpers
  - `src/icons.ts`: SVG icon library and management

### Built With
- **Obsidian Plugin API**: Native integration with workspace, commands, and settings
- **esbuild**: Fast bundling and TypeScript compilation
- **SVG Icons**: 40+ scalable vector icons with programmatic generation
- **CSS Variables**: Theme-compatible styling using Obsidian's design system
- **Event-Driven Architecture**: Comprehensive event logging and session derivation

### Performance Features
- **Efficient Timers**: Smart interval management with automatic cleanup
- **Memory Management**: Proper event listener cleanup and DOM management
- **Lazy Loading**: UI components loaded only when needed
- **Debounced Saves**: Auto-save with 60-second intervals to prevent excessive I/O
- **Mobile Optimized**: Touch-friendly interfaces and responsive layouts

### Data Management
- **Local Storage**: All data stored in Obsidian's plugin data directory
- **Event Sourcing**: Session state derived from immutable event log
- **Data Integrity**: Automatic data validation and migration support
- **Export Formats**: 
  - CSV: Spreadsheet-compatible session data
  - JSON: Complete structured data export
- **Privacy First**: No external network requests or data transmission

### Browser Compatibility
- **Desktop**: Full feature support on Windows, macOS, and Linux
- **Mobile**: Complete functionality on iOS and Android
- **Cross-Platform**: Consistent behavior across all Obsidian platforms

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

## 🔧 Available Commands

Access via Command Palette (**Ctrl/Cmd + P**):

### Core Commands
- **`Open TaskSwitch Panel`**: Opens the side panel dashboard
- **`Start/Resume Role`**: Opens role picker to start a new session
- **`Switch Role`**: Opens role picker to switch from current session (requires active session)
- **`End Current Role`**: Immediately ends the current active session
- **`Add Note to Current Session`**: Opens note editor for current session

### Planned Commands
- **`Open Role Dashboard`**: Full dashboard modal (implementation pending)
- **`Open Analytics`**: Detailed analytics view (implementation pending)

### Ribbon Actions
- **Clock Icon**: Quick access to side panel (same as "Open TaskSwitch Panel")

### Keyboard Shortcuts
Currently no default keyboard shortcuts are assigned. You can assign custom shortcuts to any command via **Settings → Hotkeys → TaskSwitch**.

## 🐛 Troubleshooting

### Common Issues

#### Plugin Not Loading
- **Solution**: Ensure `main.js`, `manifest.json` are in `.obsidian/plugins/taskswitch/`
- **Check**: Plugin is enabled in **Settings → Community plugins**
- **Restart**: Reload Obsidian or restart the application

#### Side Panel Not Opening
- **Check Console**: Open Developer Tools (Ctrl/Cmd + Shift + I) for error messages
- **Ribbon Icon**: Ensure clock icon is visible in left ribbon
- **Command**: Try **Cmd/Ctrl + P → "Open TaskSwitch Panel"**

#### Roles Not Saving
- **Permissions**: Check vault directory write permissions
- **Storage**: Verify Obsidian can write to plugin data directory
- **Validation**: Ensure role names are not empty and colors are valid hex values

#### Timer Display Issues
- **Refresh**: Close and reopen side panel
- **Browser**: Clear browser cache if using Obsidian web version
- **Mobile**: Ensure app is in foreground for timer updates

#### Session Lock Problems
- **Time Sync**: Check system clock accuracy
- **Settings**: Verify minimum session duration in plugin settings
- **Force End**: Use "End Current Role" command if stuck

### Performance Optimization

#### Large Event History
- **Auto-Cleanup**: Plugin limits displayed history to last 50 events
- **Export**: Regular data exports can help manage storage size
- **Manual Cleanup**: Consider archiving old data periodically

#### Memory Management
- **Modal Cleanup**: Timers automatically cleaned when modals close
- **Event Listeners**: All listeners properly registered for cleanup
- **Refresh**: Restart Obsidian if experiencing memory issues

### Debug Information

#### Console Logging
The plugin includes extensive console logging. Open Developer Tools to see:
- Plugin loading and initialization
- View creation and management
- Session state changes
- Error messages and stack traces

#### Data Inspection
Plugin data is stored in `.obsidian/plugins/taskswitch/data.json`. You can inspect this file to understand the current state, but avoid manual editing.

### Getting Help

1. **Check Console**: Look for error messages in Developer Tools
2. **Verify Setup**: Ensure all files are correctly placed
3. **Test Minimal**: Try with a fresh vault to isolate issues
4. **Report Issues**: Include console logs and steps to reproduce

## 🤝 Development & Contributing

### Development Setup

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd obsidian-taskswitch
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Development Build**:
   ```bash
   npm run dev  # Watch mode for development
   ```

4. **Production Build**:
   ```bash
   npm run build  # Single build for release
   ```

5. **Testing**:
   - Copy built files to test vault: `.obsidian/plugins/taskswitch/`
   - Enable plugin in Obsidian settings
   - Test functionality and check console for errors

### Project Structure
```
src/
├── main.ts              # Plugin entry point and core logic
├── types.ts             # TypeScript interfaces and types
├── utils.ts             # Utility functions
├── icons.ts             # SVG icon library
├── settings/
│   └── Settings.ts      # Settings interface
└── views/
    ├── SidePanelView.ts  # Main side panel component
    └── Modals.ts         # Modal components
```

### Contributing Guidelines

#### Code Style
- **TypeScript**: Use strict mode and proper typing
- **Formatting**: Follow existing code style and indentation
- **Comments**: Add JSDoc comments for public methods
- **Error Handling**: Proper error handling with user-friendly messages

#### Key Areas for Contribution
- **Icon Library**: Additional SVG icons and categories
- **Analytics**: Enhanced data visualization and reporting
- **Mobile UX**: Touch-optimized interactions and layouts
- **Integrations**: Compatibility with other productivity plugins
- **Accessibility**: Screen reader support and keyboard navigation
- **Themes**: Enhanced theme compatibility and custom styling

#### Feature Requests
- **Dashboard Modal**: Full-featured role dashboard implementation
- **Advanced Analytics**: Charts, graphs, and trend analysis
- **Data Import/Export**: Enhanced data management features
- **Automation**: Rule-based role switching and smart suggestions
- **Collaboration**: Team productivity features and shared roles

### Testing

#### Manual Testing Checklist
- [ ] Plugin loads without errors
- [ ] Side panel opens and displays correctly
- [ ] Role creation, editing, and deletion works
- [ ] Session starting, switching, and ending functions
- [ ] Timer displays and updates correctly
- [ ] Settings save and persist
- [ ] Commands work from palette
- [ ] Mobile interface is responsive
- [ ] Data exports successfully

#### Automated Testing
Currently no automated tests are implemented. Contributions for test setup would be valuable:
- Unit tests for utility functions
- Integration tests for plugin lifecycle
- UI tests for modal and panel interactions

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🏷️ Version Information

- **Current Version**: 0.1.0
- **Minimum Obsidian Version**: 1.6.0
- **Mobile Support**: Full (iOS and Android)
- **Desktop Support**: Windows, macOS, Linux
- **Plugin ID**: `taskswitch`

## 📋 Changelog

### Version 0.1.0 (Current)
- Initial release
- Core session management functionality
- Side panel dashboard interface
- Role creation and management
- Session locking and transition windows
- Real-time timer and status display
- Event logging and session derivation
- Settings interface with full customization
- Mobile-responsive design
- Command palette integration
- Status bar and workspace border options
- Note-taking for sessions
- Data export capabilities

## 🔮 Roadmap

### Planned Features
- **Full Dashboard Modal**: Comprehensive analytics and management interface
- **Advanced Analytics**: Charts, trends, and productivity insights
- **Data Visualization**: Graphs for session patterns and role usage
- **Smart Suggestions**: AI-powered role switching recommendations
- **Team Features**: Shared roles and collaborative productivity tracking
- **Integration APIs**: Hooks for other plugins and external tools
- **Automated Testing**: Comprehensive test suite for reliability
- **Performance Monitoring**: Built-in performance metrics and optimization

---

**Built with ❤️ for the Obsidian community.**

*Focus better, switch smarter, achieve more.*