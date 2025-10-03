# RoleSwitch - Obsidian Plugin

An Obsidian plugin that helps you consciously switch between different work roles—like developer, writer, researcher, or QA—with intentional transitions and session tracking.

> **Why I built this**: I wear many hats throughout the day (developer, writer, researcher). This plugin helps me be intentional about which role I'm in and switch between them mindfully.

## Demo
[![Demo](./image/Demo.gif)](./image/Demo.gif)

### Switch
[![Demo1](./image/Demo1.jpg)](./image/Demo1.jpg)
[![Demo2](./image/Demo2.jpg)](./image/Demo2.jpg)


## Features

- **Custom Work Roles**: Define roles like Developer, Writer, Researcher, QA with unique colors and icons
- **Intentional Transitions**: Session locks encourage mindful role switching instead of random task-jumping
- **Role Awareness**: Visual cues (status bar, workspace borders) remind you which role you're in
- **Session Tracking**: Track time spent in each role with real-time timers
- **Role Notes**: Capture thoughts and context specific to each role session
- **Analytics Export**: Review your role patterns with CSV/JSON export

## Use Cases & Examples

### Solo Developer Workflow
When you're wearing multiple hats on a project:

**🔧 Developer Role**: Writing code, implementing features
- Switch to Developer mode when coding
- Track time spent on implementation vs other activities
- Use role notes to capture technical decisions and code ideas

**🔍 QA Role**: Testing, bug hunting, quality assurance
- Switch to QA mode when testing your own code
- Approach your work with a different mindset - looking for issues rather than building
- Track testing time separately from development time
- Document bugs and edge cases in role-specific notes

**📋 Planning Role**: Architecture, project planning, requirements
- Switch to Planning mode for high-level thinking
- Step back from code details to see the bigger picture
- Track time spent on strategic thinking vs tactical work

### Content Creator Workflow
For writers, bloggers, and content creators:

**✍️ Writer Role**: Creating first drafts, brainstorming content
- Focus purely on getting ideas down without judgment
- Track productive writing time vs editing time
- Capture creative ideas in role-specific notes

**📝 Editor Role**: Reviewing, refining, and polishing content
- Switch mindset from creative to critical
- Approach your own work objectively for better editing
- Track revision time to understand your editing patterns

**📊 Reviewer Role**: Final review, fact-checking, publishing prep
- Final quality check with fresh perspective
- Ensure consistency and accuracy before publication
- Document review checklists and publishing notes

### Research & Analysis Work
For researchers, analysts, and knowledge workers:

**🔍 Researcher Role**: Gathering information, exploring topics
- Deep dive into sources and materials
- Track research time vs analysis time
- Collect and organize findings in role notes

**🧠 Analyst Role**: Processing information, drawing conclusions
- Switch from gathering to synthesizing mode
- Focus on patterns and insights rather than collection
- Document analytical frameworks and methodologies

**📊 Evaluator Role**: Reviewing findings, quality control
- Step back to assess research quality and completeness
- Challenge your own conclusions with fresh eyes
- Track validation and review activities separately

## Quick Start

1. **Install**: Enable "RoleSwitch" in **Settings → Community plugins**
2. **Setup**: Go to **Settings → RoleSwitch** and create your work roles (e.g., "Developer", "Writer", "Researcher")
3. **Use**: Click the clock icon in the ribbon to open the role panel
4. **Switch**: Click on any role to enter that mindset and start tracking time

## Documentation

- **[Features](docs/FEATURES.md)** - Detailed feature overview
- **[Installation](docs/INSTALLATION.md)** - Installation and setup guide
- **[Usage](docs/USAGE.md)** - Interface guide and usage patterns
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Development](docs/DEVELOPMENT.md)** - Contributing and technical details

## Version Information

- **Version**: 0.1.0
- **Minimum Obsidian**: 1.6.0
- **Platforms**: Windows, macOS, Linux, iOS, Android
- **License**: MIT

## Disabled Features

The following features are currently disabled in this version but remain in the codebase for future use:

- **API & Synchronization Settings**: Combined API server and device synchronization functionality (will be enabled in a future version)
- **Donation Section**: Support development section in settings (currently commented out)

These features can be re-enabled by uncommenting the relevant sections in `src/settings/Settings.ts`.

---

*Be intentional about your roles. Switch with purpose.*