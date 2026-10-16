# Customer Tag Sorter - Obsidian Plugin

## Overview
Sorts notes into customer/project folders based on frontmatter properties.

## Paths
- **Source**: `/Users/robert.stickler/Development/Obsidian Plugin/CustomerTag`
- **Installed in**: `/Users/robert.stickler/Library/CloudStorage/OneDrive-Personal/Dokumente/Obsidian/Obsidian-Full-Vault/.obsidian/plugins/customer-tag-sorter`

## Build & Install
```bash
bun run build
cp main.js manifest.json "/Users/robert.stickler/Library/CloudStorage/OneDrive-Personal/Dokumente/Obsidian/Obsidian-Full-Vault/.obsidian/plugins/customer-tag-sorter/"
```

## Features
- Configurable source folder (where to scan for files)
- Configurable target folder (e.g., "Customer" creates Customer/ClientName/)
- Configurable property name (default: "Customer")
- Supports both string and array frontmatter formats
- Run on startup option
- Manual sort button in settings
