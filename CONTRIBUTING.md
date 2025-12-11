# Contributing to AI Outreach Agent

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/linkedin.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `npm test`
6. Commit your changes: `git commit -m "feat: add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Run in development mode
npm run dev

# Run tests
npm test

# Build
npm run build
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code structure and patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose
- Maximum line length: 100 characters

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add support for Twitter DM channel
fix: resolve rate limiting issue in HeyReach client
docs: update README with new configuration options
```

## Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for >80% code coverage
- Test edge cases and error scenarios

## Pull Request Guidelines

1. **Description**: Clearly describe what your PR does and why
2. **Testing**: Include test results and manual testing notes
3. **Documentation**: Update relevant documentation
4. **Breaking Changes**: Clearly mark and explain breaking changes
5. **Size**: Keep PRs focused and reasonably sized

## Areas for Contribution

### High Priority
- Additional channel integrations (Twitter, Email platforms)
- Enhanced analytics and reporting
- UI/Dashboard for campaign management
- More sophisticated A/B testing
- Additional enrichment source integrations

### Medium Priority
- Performance optimizations
- Additional safety and spam detection rules
- More example campaigns and templates
- Integration guides for popular CRMs
- Improved error handling and recovery

### Low Priority
- Code refactoring and cleanup
- Documentation improvements
- Additional test coverage
- Example scripts and tutorials

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Check existing issues and discussions first

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help create a welcoming environment

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
