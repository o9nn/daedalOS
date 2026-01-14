# CLAUDE.md - Project Instructions for Claude Code

## Project Overview

daedalOS is a desktop environment that runs entirely in the browser. Built with Next.js and React, it provides a Windows-like operating system interface with file system management, multiple applications (Terminal, Editor, PDF viewer, Browser, etc.), game emulators, and advanced features like Git support and local LLM inference.

## Tech Stack

- **Framework**: Next.js 15.x with React 19.x
- **Language**: TypeScript (strict mode)
- **Styling**: Styled Components
- **Animation**: Motion (Framer Motion)
- **File System**: BrowserFS with IndexedDB storage
- **Testing**: Jest (unit), Playwright (E2E)
- **Linting**: ESLint, Stylelint, Prettier

## Development Commands

```bash
yarn dev              # Start dev server on port 3000
yarn build            # Build for production (runs prebuild first)
yarn build:prebuild   # Generate fs index, search index, icons, etc.
yarn test             # Run Jest unit tests
yarn e2e              # Run Playwright E2E tests
yarn eslint           # Run ESLint
yarn stylelint        # Run Stylelint
yarn prettier         # Format code with Prettier
```

## Code Conventions

### TypeScript

- Strict mode enabled - all functions require explicit return types
- Use type-only imports: `import type { X } from "..."`
- Custom FC type for components: `const Component: FC<Props> = () => { ... }`

### React Components

- Use arrow function components with explicit typing
- Wrap components in `memo()` for performance
- Use `dynamic()` from Next.js for code splitting heavy components
- Each component in its own folder with `index.tsx`

### Styling

- Styled components in separate `StyledX.ts` files
- CSS properties must be alphabetically sorted (enforced by Stylelint)
- Use theme values from `defaultTheme`

### Imports

- Use absolute imports from project root (no relative imports like `../`)
- Import order is strictly enforced by ESLint
- Separate type imports on their own lines

### Naming

- Constants: `UPPER_SNAKE_CASE`
- Variables/functions: `camelCase`
- Components: `PascalCase`
- Styled components: `StyledComponentName`
- Custom hooks: `useHookName`

## Project Structure

```
components/
  apps/           # Individual app components (Terminal, Editor, etc.)
  system/         # Core UI (Desktop, Taskbar, Window, StartMenu)
contexts/         # React Context state management
  fileSystem/     # File system state
  process/        # Process/window state
  session/        # Theme, wallpaper, settings
hooks/            # Custom React hooks
utils/            # Utility functions, constants, types
styles/           # Global styles, themes
pages/            # Next.js pages
public/System/    # Static assets, WASM modules, icons
scripts/          # Build scripts (fs2json, searchIndex, etc.)
__tests__/        # Jest unit tests
e2e/              # Playwright E2E tests
```

## State Management

Uses React Context with a custom factory pattern:

```typescript
const { Provider, useContext } = contextFactory(useContextState);
```

Key contexts: FileSystem, Process, Session, Viewport, Menu

## Important Notes

- The prebuild step (`yarn build:prebuild`) generates required files for the app
- CORS headers are configured for SharedArrayBuffer support (needed for WASM)
- Web Workers are used for heavy operations (image resizing, clock rendering)
- `NODE_OPTIONS='--openssl-legacy-provider'` may be needed on older systems

## Testing

- Unit tests: `__tests__/` directory, run with `yarn test`
- E2E tests: `e2e/` directory, run with `yarn e2e`
- Pre-commit hooks run lint-staged (prettier, stylelint, eslint)
