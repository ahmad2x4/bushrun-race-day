# Bushrun Race Day

A Progressive Web App (PWA) for managing race day operations for running clubs, including runner check-in, race timing, and results calculation with handicap system.

## Features

- **Runner Management**: Import runner data via CSV with automatic validation
- **Check-in System**: Streamlined check-in process with number assignment
- **Race Timing**: Precise finish time recording with cross-race time calculation
- **Handicap System**: Automatic handicap calculation based on performance
- **Results Calculation**: Real-time results with adjustable finish times
- **Dark Mode**: Full dark mode support for better visibility in various conditions
- **Offline-First**: Built with IndexedDB for reliable offline operation
- **Responsive Design**: Mobile-first design optimized for race day conditions

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: IndexedDB (via custom db layer)
- **Build Tool**: Vite
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Component Dev**: Storybook

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bushrun-race-day

# Install dependencies
npm install
```

### Development

```bash
# Start development server (http://localhost:5174)
npm run dev

# Run unit tests
npm test

# Run tests with UI
npm test:ui

# Run E2E tests
npm run test:e2e

# Run linter
npm run lint

# Start Storybook
npm run storybook
```

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI primitives
│   ├── forms/          # Form components
│   └── race/           # Race-specific components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── types.ts            # TypeScript type definitions
├── db.ts              # IndexedDB layer
├── raceLogic.ts       # Core race calculations
└── App.tsx            # Main application component
```

## Documentation

Detailed documentation is available in the [docs/](docs/) directory:

- [Technical Specification](docs/specifications/BUSHRUN_RACE_DAY_SPECIFICATION.md)
- [Design System](docs/specifications/DESIGN.md)
- [Development Guidelines](CLAUDE.md)
- [Future Planning](docs/planning/)
- [Completed Features](docs/history/Backlog_done.md)

## Development Guidelines

Please refer to [CLAUDE.md](CLAUDE.md) for comprehensive development guidelines including:
- Coding standards
- Architecture patterns
- Testing strategies
- Component development
- Accessibility requirements

## Active Backlog

See [BACKLOG.md](BACKLOG.md) for current development priorities and planned features.

## Contributing

1. Follow the guidelines in [CLAUDE.md](CLAUDE.md)
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Use conventional commit messages
5. Update documentation as needed

## License

[Add license information here]

## Contact

[Add contact information or links here]
