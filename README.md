# Customer Tag Sorter

An Obsidian plugin that automatically organizes your notes into customer-specific folders based on frontmatter tags.

## Features

- **Automatic Sorting**: Scans a source folder and moves files to customer folders based on the `Customer` frontmatter tag
- **Configurable Source Folder**: Choose which folder to scan for files
- **Run on Startup**: Optionally sort files automatically when Obsidian starts
- **Manual Trigger**: Use the command palette (`Cmd/Ctrl + P`) to sort files on demand
- **Settings UI**: Easy configuration through the plugin settings tab

## Installation

### Manual Installation

1. Download `main.js` and `manifest.json` from the latest release
2. Create a folder in your vault: `.obsidian/plugins/customer-tag-sorter/`
3. Copy `main.js` and `manifest.json` into this folder
4. Restart Obsidian
5. Enable the plugin in Settings → Community Plugins

## Usage

### Frontmatter Format

Add a `Customer` tag to your note's frontmatter:

```yaml
---
Customer: Acme Corp
---

Your note content here...
```

This file will be moved to `Acme Corp/filename.md`.

### Commands

- **Sort files by Customer tag**: Manually trigger the sorting process

### Settings

| Setting | Description |
|---------|-------------|
| Source Folder | The folder to scan for files with Customer tags (default: `Notes`) |
| Run on Startup | Automatically sort files when Obsidian starts |
| Sort Now | Button to manually trigger sorting |

## Development

```bash
# Install dependencies
bun install

# Build for development (with watch)
bun run dev

# Build for production
bun run build
```

## Part of the BytesAndParty Plugin Suite

This plugin works great alongside other plugins from the same author:

- [Auto Categories](https://github.com/BytesAndParty/Obsidian_AutoCategories) - Automatically create category pages from frontmatter
- [Better Gitignore](https://github.com/BytesAndParty/BetterGitignore) - Beautiful .gitignore editor with templates
- [Command Overview](https://github.com/BytesAndParty/CommandOverview) - Quick command palette with shortcuts
- [Company Knowledge Hub](https://github.com/BytesAndParty/CompanyKnowledgeHub) - Publish notes to a shared knowledge base

## License

MIT
