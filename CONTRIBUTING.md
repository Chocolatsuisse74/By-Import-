# Contributing to By-Import

Thank you for your interest in contributing to By-Import! We welcome contributions from the community.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file from `.env.example`
4. Start development server: `npm run dev`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Format code: `npm run format`
6. Commit with descriptive message
7. Push and create a pull request

## Code Standards

- TypeScript with strict mode enabled
- Follow ESLint configuration
- Format with Prettier
- Write tests for new features
- Document complex logic

## Testing

```bash
npm test              # Run tests
npm run test:cov     # Run with coverage
```

## Linting and Formatting

```bash
npm run lint         # Check linting issues
npm run lint:fix     # Fix linting issues
npm run format       # Format with Prettier
npm run typecheck    # Check TypeScript types
```

## Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

## Pull Request Process

1. Update README.md with new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Request review from maintainers
5. Merge after approval

## Questions?

Feel free to open an issue for questions or discussions.
