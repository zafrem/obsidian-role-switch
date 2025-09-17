# Troubleshooting

## 🐛 Common Issues

### Plugin Not Loading
- **Solution**: Ensure `main.js`, `manifest.json` are in `.obsidian/plugins/role-switch/`
- **Check**: Plugin is enabled in **Settings → Community plugins**
- **Restart**: Reload Obsidian or restart the application

### Side Panel Not Opening
- **Check Console**: Open Developer Tools (Ctrl/Cmd + Shift + I) for error messages
- **Ribbon Icon**: Ensure clock icon is visible in left ribbon
- **Command**: Try **Cmd/Ctrl + P → "Open RoleSwitch Panel"**

### Roles Not Saving
- **Permissions**: Check vault directory write permissions
- **Storage**: Verify Obsidian can write to plugin data directory
- **Validation**: Ensure role names are not empty and colors are valid hex values

### Timer Display Issues
- **Refresh**: Close and reopen side panel
- **Browser**: Clear browser cache if using Obsidian web version
- **Mobile**: Ensure app is in foreground for timer updates

### Session Lock Problems
- **Time Sync**: Check system clock accuracy
- **Settings**: Verify minimum session duration in plugin settings
- **Force End**: Use "End Current Role" command if stuck

## Performance Optimization

### Large Event History
- **Auto-Cleanup**: Plugin limits displayed history to last 50 events
- **Export**: Regular data exports can help manage storage size
- **Manual Cleanup**: Consider archiving old data periodically

### Memory Management
- **Modal Cleanup**: Timers automatically cleaned when modals close
- **Event Listeners**: All listeners properly registered for cleanup
- **Refresh**: Restart Obsidian if experiencing memory issues

## Debug Information

### Console Logging
The plugin includes extensive console logging. Open Developer Tools to see:
- Plugin loading and initialization
- View creation and management
- Session state changes
- Error messages and stack traces

### Data Inspection
Plugin data is stored in `.obsidian/plugins/role-switch/data.json`. You can inspect this file to understand the current state, but avoid manual editing.

## Getting Help

1. **Check Console**: Look for error messages in Developer Tools
2. **Verify Setup**: Ensure all files are correctly placed
3. **Test Minimal**: Try with a fresh vault to isolate issues
4. **Report Issues**: Include console logs and steps to reproduce