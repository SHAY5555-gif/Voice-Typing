# Contributing

Thanks for contributing to Voice Typing.

## Before You Start

- Read the [README.md](README.md) for product context
- Check existing issues and pull requests before starting duplicate work
- Never commit secrets, API keys, or `.env` files

## Local Setup

1. Install dependencies with `npm ci`
2. Run `npm run check`
3. Load the repository root as an unpacked extension in Chrome
4. Test microphone, tab audio, and desktop audio flows for the area you changed

## Pull Request Expectations

- Keep changes focused and easy to review
- Update docs when behavior or permissions change
- Run `npm run check` before opening the PR
- Describe user-facing changes and manual test steps
- Add screenshots or short recordings for UI changes when helpful

## Coding Guidelines

- Prefer simple browser-native solutions over extra frameworks
- Keep extension runtime files small and readable
- Use English identifiers in code and docs
- Preserve RTL correctness for Hebrew UI text

## Commit Hygiene

- Use clear commit messages
- Do not commit generated archives or local transcripts
- Do not commit `.env`, API keys, or temporary audio files

## Reporting Bugs

Open an issue with:

- What you expected to happen
- What actually happened
- Chrome version and operating system
- Steps to reproduce
- Console errors or screenshots if available
