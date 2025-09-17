# Development & Contributing

## 🤝 Development Setup

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd obsidian-role-switch
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
   - Copy built files to test vault: `.obsidian/plugins/role-switch/`
   - Enable plugin in Obsidian settings
   - Test functionality and check console for errors

## Project Structure
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

## Contributing Guidelines

### Code Style
- **TypeScript**: Use strict mode and proper typing
- **Formatting**: Follow existing code style and indentation
- **Comments**: Add JSDoc comments for public methods
- **Error Handling**: Proper error handling with user-friendly messages

### Key Areas for Contribution
- **Icon Library**: Additional SVG icons and categories
- **Analytics**: Enhanced data visualization and reporting
- **Mobile UX**: Touch-optimized interactions and layouts
- **Integrations**: Compatibility with other productivity plugins
- **Accessibility**: Screen reader support and keyboard navigation
- **Themes**: Enhanced theme compatibility and custom styling

### Feature Requests
- **Dashboard Modal**: Full-featured role dashboard implementation
- **Advanced Analytics**: Charts, graphs, and trend analysis
- **Data Import/Export**: Enhanced data management features
- **Automation**: Rule-based role switching and smart suggestions
- **Collaboration**: Team productivity features and shared roles

## Testing

### Manual Testing Checklist
- [ ] Plugin loads without errors
- [ ] Side panel opens and displays correctly
- [ ] Role creation, editing, and deletion works
- [ ] Session starting, switching, and ending functions
- [ ] Timer displays and updates correctly
- [ ] Settings save and persist
- [ ] Commands work from palette
- [ ] Mobile interface is responsive
- [ ] Data exports successfully

### Automated Testing
Currently no automated tests are implemented. Contributions for test setup would be valuable:
- Unit tests for utility functions
- Integration tests for plugin lifecycle
- UI tests for modal and panel interactions

## 🛠️ Technical Details

### Architecture
- **TypeScript**: Full type safety with strict mode enabled
- **Modular Design**: Clean separation of concerns across multiple files
- **Built With**:
  - Obsidian Plugin API: Native integration with workspace, commands, and settings
  - esbuild: Fast bundling and TypeScript compilation
  - SVG Icons: 40+ scalable vector icons with programmatic generation
  - CSS Variables: Theme-compatible styling using Obsidian's design system
  - Event-Driven Architecture: Comprehensive event logging and session derivation

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
- **Export Formats**: CSV and JSON with complete structured data
- **Privacy First**: No external network requests or data transmission

### Browser Compatibility
- **Desktop**: Full feature support on Windows, macOS, and Linux
- **Mobile**: Complete functionality on iOS and Android
- **Cross-Platform**: Consistent behavior across all Obsidian platforms