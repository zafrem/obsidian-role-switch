# TaskSwitch Plugin - Modular Architecture

This directory contains the refactored modular components of the TaskSwitch plugin.

## Structure

```
src/
├── icons.ts          # Icon library with SVG icons and rendering utilities
├── types.ts          # TypeScript interfaces and type definitions
├── utils.ts          # Utility functions for data processing and formatting
├── views/
│   ├── SidePanelView.ts  # Side panel view component
│   └── Modals.ts         # Modal components (Transition, RolePicker, etc.)
└── settings/
    └── Settings.ts       # Settings tab and configuration modals
```

## Components

### Core Modules

- **`icons.ts`**: Contains all SVG icons organized by category and provides safe rendering methods
- **`types.ts`**: All TypeScript interfaces and default settings
- **`utils.ts`**: Utility functions for date manipulation, data processing, and export

### Views

- **`SidePanelView.ts`**: The main side panel dashboard view
- **`Modals.ts`**: All modal dialogs including transition, role picker, and note editing

### Settings

- **`Settings.ts`**: Settings tab with role management and configuration options

## Benefits of Modular Structure

1. **Maintainability**: Each component has a clear responsibility
2. **Reusability**: Components can be easily reused or tested independently  
3. **Readability**: Much smaller, focused files that are easier to understand
4. **Scalability**: Easy to add new features without bloating existing files
5. **Type Safety**: Better TypeScript support with proper imports

## Main Plugin File

The main `main.ts` file now focuses on:
- Plugin lifecycle management
- Data persistence
- Core business logic
- Coordinating between components

It imports and uses the modular components rather than containing all the implementation details.