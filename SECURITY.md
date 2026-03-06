# Security Policy

## Supported Versions

Security fixes are applied to the latest code on `main`.

## Reporting a Vulnerability

Do not report security vulnerabilities in public GitHub issues.

Send a private report to:

- `ym422134@gmail.com`

Include:

- A short description of the issue
- Steps to reproduce
- Impact assessment
- Any proof of concept or screenshots

You should receive an acknowledgement within 72 hours.

## Secret Handling

- Never commit `.env` files
- Never commit live API keys
- Use `.env.example` for placeholders only
- Rotate any key immediately if it is exposed
