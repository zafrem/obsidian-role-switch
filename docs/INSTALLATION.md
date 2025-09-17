# Installation & Setup

## 🚀 Installation

### Manual Installation
1. Download the latest release files:
   - `main.js` (compiled plugin code)
   - `manifest.json` (plugin metadata)
   - `styles.css` (optional styling)
2. Create directory: `<your-vault>/.obsidian/plugins/role-switch/`
3. Place all files in the created directory
4. Restart Obsidian or reload plugins
5. Enable "RoleSwitch" in **Settings → Community plugins**

### Development Installation
1. Clone this repository into your vault's plugins folder:
   ```bash
   cd <your-vault>/.obsidian/plugins/
   git clone <repository-url> role-switch
   cd role-switch
   ```
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Enable the plugin in Obsidian settings

## Quick Setup
1. **Access Settings**: Go to **Settings → RoleSwitch**
2. **Create Your First Role**:
   - Click "Add Role"
   - Choose a name (e.g., "Deep Work")
   - Select an icon (e.g., laptop)
   - Pick a color
   - Add optional description
3. **Configure Timing**: Adjust session and transition durations to match your workflow
4. **Open Panel**: Click the clock icon in the ribbon or use **Cmd/Ctrl + P → "Open RoleSwitch Panel"**
5. **Start Your First Session**: Click on your role in the side panel