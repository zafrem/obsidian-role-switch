# RoleSwitch - Obsidian Plugin

## Project overview

**RoleSwitch** is a sophisticated productivity plugin for Obsidian that reduces context-switching costs through enforced session locks, transition windows, and comprehensive role-based task management with real-time tracking and analytics.

- **Target**: Obsidian Community Plugin (TypeScript → bundled JavaScript)
- **Plugin ID**: `role-switch`
- **Entry point**: `main.ts` compiled to `main.js` and loaded by Obsidian
- **Required release artifacts**: `main.js`, `manifest.json`, and optional `styles.css`
- **Current Version**: 0.1.1
- **Minimum Obsidian Version**: 1.6.0
- **Mobile Support**: Full (iOS and Android)

## Environment & tooling

- **Node.js**: Current LTS (Node 16+ recommended)
- **Package manager**: npm (required - `package.json` defines npm scripts and dependencies)
- **Bundler**: esbuild (required - `esbuild.config.mjs` and build scripts depend on it)
- **TypeScript**: 4.7.4 with strict mode enabled
- **Types**: `obsidian` type definitions (latest)

### Install

```bash
npm install
```

### Dev (watch)

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Version management

```bash
npm run version
```

## Core Features

- **Role-Based Task Management**: Create custom roles with names, colors, descriptions, and icons
- **Anti-Micro-Switching System**: Enforced minimum session durations and transition windows
- **Real-Time Tracking**: Live session tracking with comprehensive analytics
- **Visual Experience**: Side panel dashboard, status bar, workspace border, and interactive modals
- **Session Notes**: Add contextual notes to any session
- **Data Export**: CSV and JSON export capabilities with date filtering

## File & folder conventions

**RoleSwitch follows a modular architecture with clean separation of concerns:**

### Actual project structure:
```
src/
  main.ts              # Plugin entry point and core functionality (525 lines)
  types.ts             # TypeScript interfaces and type definitions
  utils.ts             # Utility functions and helpers
  icons.ts             # SVG icon library (40+ icons)
  settings/
    Settings.ts        # Settings interface and management
  views/
    SidePanelView.ts   # Main side panel component
    Modals.ts          # Modal components (Transition, RolePicker, etc.)
  README.md            # Source documentation
```

### Key architectural decisions:
- **main.ts contains core logic**: Unlike typical samples, this plugin keeps substantial functionality in main.ts (525 lines) including session management, role operations, and UI coordination
- **Modular UI components**: Views and modals are separated into dedicated files
- **Comprehensive type system**: Full TypeScript interfaces for all data structures
- **Rich icon library**: 40+ categorized SVG icons with programmatic rendering
- **Utility-first approach**: Common operations centralized in utils.ts

### Build artifacts:
- **Do not commit**: `node_modules/`, `main.js`, or other generated files
- **Release artifacts**: Must be at plugin root (`main.js`, `manifest.json`, `styles.css`)
- **Mobile compatibility**: No Node/Electron APIs used (`isDesktopOnly: false`)

## Manifest configuration

**Current manifest.json:**
```json
{
  "id": "role-switch",
  "name": "RoleSwitch", 
  "version": "0.0.1",
  "minAppVersion": "1.6.0",
  "description": "A lightweight plugin that reduces context-switching cost with enforced transition windows and session tracking.",
  "author": "Zafrem",
  "authorUrl": "https://github.com/zafrem",
  "isDesktopOnly": false
}
```

**Key points:**
- **Stable ID**: `role-switch` - never change after release
- **Mobile support**: `isDesktopOnly: false` enables iOS/Android compatibility
- **Version tracking**: Uses semantic versioning, managed via `version-bump.mjs`
- **Minimum version**: Requires Obsidian 1.6.0+ for modern API features

## Testing

- Manual install for testing: copy `main.js`, `manifest.json`, `styles.css` (if any) to:
  ```
  <Vault>/.obsidian/plugins/<plugin-id>/
  ```
- Reload Obsidian and enable the plugin in **Settings → Community plugins**.

## Commands & settings

### Registered commands (in main.ts):
- `open-role-switch-panel`: Opens the side panel dashboard
- `open-role-dashboard`: Opens role dashboard modal
- `start-role`: Opens role picker to start a new session
- `switch-role`: Opens role picker to switch from current session
- `end-current-role`: Immediately ends the current active session
- `add-note`: Opens note editor for current session

### Settings system:
- **Settings tab**: `RoleSwitchSettingsTab` class in `src/settings/Settings.ts`
- **Data persistence**: Uses `this.loadData()` / `this.saveData()` with auto-save every 60 seconds
- **Default settings**: Defined in `src/types.ts` as `DEFAULT_SETTINGS`
- **Configuration options**:
  - Transition duration (30-600 seconds)
  - Minimum session duration (300-3600 seconds)
  - Visual preferences (status bar, workspace border, opacity)

### Data structure:
```typescript
interface RoleSwitchData {
  roles: Role[];
  events: RoleSwitchEvent[];
  state: RoleSwitchState;
  settings: RoleSwitchSettings;
}
```

## Versioning & releases

### Version management:
- **Current version**: 0.1.1 (initial release)
- **Version script**: `npm run version` uses `version-bump.mjs` to sync `manifest.json` and `versions.json`
- **Version mapping**: `versions.json` maps plugin version → minimum Obsidian version

### Release process:
1. Run `npm run build` to generate `main.js`
2. Run `npm run version` to bump version numbers
3. Create GitHub release with tag matching `manifest.json` version (no `v` prefix)
4. Attach release artifacts: `main.js`, `manifest.json`, `styles.css`
5. Submit to Obsidian community plugin catalog

### Current release artifacts:
- `main.js`: Compiled TypeScript bundle
- `manifest.json`: Plugin metadata
- `styles.css`: Optional styling (if present)

## Security, privacy, and compliance

**RoleSwitch follows strict privacy-first principles:**

### Privacy features:
- **100% local operation**: No network requests, no external services
- **No telemetry**: Zero data collection or transmission
- **Vault-only access**: Only reads/writes plugin data within vault
- **No remote code**: No external script loading or execution
- **Privacy by design**: All session data stays on user's device

### Security implementation:
- **Safe DOM management**: All listeners registered via `this.register*` helpers
- **Memory cleanup**: Proper cleanup of timers, intervals, and event listeners
- **Data validation**: Input validation for colors, durations, and text fields
- **Error handling**: Graceful error handling with user-friendly messages

### Compliance:
- **Obsidian policies**: Fully compliant with Developer Policies and Plugin Guidelines
- **Mobile compatibility**: No desktop-only APIs used
- **Clean unloading**: Proper cleanup in `onunload()` method

## UX & copy guidelines (for UI text, commands, settings)

- Prefer sentence case for headings, buttons, and titles.
- Use clear, action-oriented imperatives in step-by-step copy.
- Use **bold** to indicate literal UI labels. Prefer "select" for interactions.
- Use arrow notation for navigation: **Settings → Community plugins**.
- Keep in-app strings short, consistent, and free of jargon.

## Performance

- Keep startup light. Defer heavy work until needed.
- Avoid long-running tasks during `onload`; use lazy initialization.
- Batch disk access and avoid excessive vault scans.
- Debounce/throttle expensive operations in response to file system events.

## Coding conventions

**RoleSwitch uses modern TypeScript with strict conventions:**

### TypeScript configuration:
- **Strict mode**: `"strict": true` enabled in `tsconfig.json`
- **Version**: TypeScript 4.7.4
- **Full typing**: All interfaces defined in `src/types.ts`
- **No any types**: Comprehensive type coverage

### Architecture decisions:
- **Substantial main.ts**: Unlike typical samples, main.ts contains 525 lines of core functionality
- **Modular UI**: Views and modals separated into dedicated files
- **Utility centralization**: Common functions in `src/utils.ts`
- **Icon system**: Comprehensive SVG library in `src/icons.ts`

### Code style:
- **Async/await**: Preferred over promise chains
- **Error handling**: Graceful error handling with user notices
- **Mobile compatibility**: No Node/Electron APIs (`isDesktopOnly: false`)
- **Clean separation**: Clear boundaries between data, UI, and business logic
- **Event-driven**: Comprehensive event logging and session derivation

### File size considerations:
- **main.ts**: 525 lines (substantial core functionality)
- **utils.ts**: 273 lines (comprehensive utilities)
- **icons.ts**: 127 lines (40+ SVG icons)
- **Modular approach**: Large features split across multiple files

## Mobile

- Where feasible, test on iOS and Android.
- Don't assume desktop-only behavior unless `isDesktopOnly` is `true`.
- Avoid large in-memory structures; be mindful of memory and storage constraints.

## RoleSwitch-specific development guidelines

### Core functionality patterns:
- **Session management**: All session operations go through main.ts methods (`startSession`, `switchSession`, `endSession`)
- **Event logging**: Every state change creates a `RoleSwitchEvent` for audit trail
- **Data derivation**: Sessions are derived from events using `Utils.deriveSessionsFromEvents()`
- **Auto-save**: Plugin data auto-saves every 60 seconds via `registerInterval`

### UI patterns:
- **Side panel**: Primary interface via `RoleSwitchView` in left sidebar
- **Modals**: Transition, role picker, note editing, and dashboard modals
- **Status indicators**: Status bar and optional workspace border show active role
- **Icon system**: Use `IconLibrary.createIconElement()` for consistent icon rendering

### Data management:
- **Local storage**: All data in `.obsidian/plugins/role-switch/data.json`
- **Type safety**: Use interfaces from `src/types.ts` for all data structures
- **Validation**: Validate user inputs (colors, durations, text) before saving
- **Migration**: Support data structure changes for future versions

## RoleSwitch implementation examples

### Role management pattern:
```ts
// Creating a role (from main.ts)
createRole(name: string, colorHex: string, description?: string, icon?: string): Role {
  const role: Role = {
    id: Utils.generateId(),
    name,
    colorHex,
    description,
    icon
  };
  
  this.data.roles.push(role);
  this.savePluginData();
  this.refreshSidePanel();
  return role;
}
```

### Session management pattern:
```ts
// Starting a session with event logging
startSession(roleId: string): void {
  const sessionId = Utils.generateId();
  const now = new Date().toISOString();
  
  // Update state
  this.data.state = {
    activeRoleId: roleId,
    activeSessionId: sessionId,
    activeStartAt: now,
    inTransition: false,
    lockUntil: new Date(Date.now() + this.data.settings.minSessionSeconds * 1000).toISOString()
  };
  
  // Log event
  this.data.events.push({
    id: Utils.generateId(),
    type: 'start',
    roleId,
    at: now,
    meta: { sessionId }
  });
}
```

### Icon rendering pattern:
```ts
// Using the icon library
const iconElement = IconLibrary.createIconElement('laptop', 24, '#3498db');
container.appendChild(iconElement);
```

### RoleSwitch command registration:
```ts
// All commands registered in main.ts registerCommands() method
this.addCommand({
  id: 'open-role-switch-panel',
  name: 'Open RoleSwitch Panel',
  callback: () => this.activateView()
});

this.addCommand({
  id: 'start-role',
  name: 'Start/Resume Role',
  callback: () => new RolePickerModal(this.app, this, 'start').open()
});
```

### Data persistence pattern:
```ts
// RoleSwitch uses comprehensive data structure
interface RoleSwitchData {
  roles: Role[];
  events: RoleSwitchEvent[];
  state: RoleSwitchState;
  settings: RoleSwitchSettings;
}

// Auto-save every minute
this.registerInterval(window.setInterval(() => {
  this.savePluginData();
}, 60000));
```

### Safe cleanup pattern:
```ts
// All timers and listeners properly registered
this.registerInterval(window.setInterval(() => { /* auto-save */ }, 60000));
this.registerDomEvent(window, 'resize', () => { /* handle resize */ });

// Cleanup in onunload
onunload() {
  this.removeStatusBar();
  this.removeWorkspaceBorder();
}
```

## RoleSwitch troubleshooting

### Common issues:
- **Plugin not loading**: Ensure `main.js`, `manifest.json` in `.obsidian/plugins/role-switch/`
- **Build failures**: Run `npm run build` - requires esbuild and TypeScript compilation
- **Side panel not opening**: Check console for errors, try ribbon icon or command palette
- **Roles not saving**: Verify write permissions, check data validation in settings
- **Timer issues**: Ensure system clock accuracy, check session lock logic
- **Mobile problems**: Plugin is mobile-compatible (`isDesktopOnly: false`)

### Debug information:
- **Console logging**: Extensive logging throughout main.ts for debugging
- **Data inspection**: Check `.obsidian/plugins/role-switch/data.json` for current state
- **Event tracking**: All actions logged as `RoleSwitchEvent` objects
- **Session derivation**: Sessions reconstructed from event log via `Utils.deriveSessionsFromEvents()`

### Performance considerations:
- **Large event history**: Plugin handles 50+ events efficiently
- **Memory management**: Proper cleanup of DOM elements and timers
- **Auto-save frequency**: 60-second intervals balance performance and data safety

## RoleSwitch architecture summary

### Key components:
- **main.ts**: 525 lines of core functionality including session management, role operations, UI coordination
- **src/types.ts**: Complete TypeScript interfaces for all data structures
- **src/utils.ts**: 273 lines of utility functions including session derivation and analytics
- **src/icons.ts**: 40+ categorized SVG icons with programmatic rendering
- **src/views/**: Side panel and modal components
- **src/settings/**: Settings interface and management

### Data flow:
1. **User actions** → Commands or UI interactions
2. **State changes** → Event logging in `data.events`
3. **Session derivation** → `Utils.deriveSessionsFromEvents()` reconstructs sessions
4. **UI updates** → Status bar, side panel, workspace border refresh
5. **Auto-save** → Data persisted every 60 seconds

### References:
- **Plugin repository**: Current RoleSwitch implementation
- **Obsidian API**: https://docs.obsidian.md
- **Plugin guidelines**: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- **TypeScript**: Strict mode enabled for type safety
