# Backchannel

A macOS app for searching and analyzing your iMessage conversations using AI.

## Development Setup

### Prerequisites
- Node.js 18+
- Rust (latest stable)
- macOS with Full Disk Access permissions

### Running the App

```bash
npm install
npm run tauri dev
```

### Building

```bash
npx tauri build --debug
```

The built app will be at:
```
src-tauri/target/debug/bundle/macos/Backchannel.app
```

## macOS Permissions

This app requires **Full Disk Access** to read the iMessage database at `~/Library/Messages/chat.db`.

1. Open **System Settings** > **Privacy & Security** > **Full Disk Access**
2. Click **+** and add the Backchannel app
3. Toggle it ON
4. Restart the app

## Development Notes

### Bundle Identifier Conflicts (Important!)

When working on this project in multiple directories or branches, you may encounter issues where:
- The wrong app version launches
- Permissions don't work correctly
- Multiple password prompts appear
- Debug logs aren't created

**Root Cause**: macOS uses the bundle identifier (in `tauri.conf.json`) to identify apps. If multiple builds exist with the same identifier, macOS may launch the wrong one.

**Solution**: Each development environment should use a unique bundle identifier:

```json
// src-tauri/tauri.conf.json
{
  "identifier": "com.backchannel.toronto"  // Use unique suffix per workspace
}
```

**How to diagnose**:
```bash
# Find all apps with the same bundle identifier
mdfind "kMDItemCFBundleIdentifier == 'com.backchannel.app'"

# Find all apps named Backchannel
mdfind "kMDItemDisplayName == 'Backchannel'"
```

**Additional notes**:
- Never use a bundle identifier ending in `.app` (e.g., `com.backchannel.app`) as it conflicts with macOS bundle extensions
- After changing the identifier, delete old builds and rebuild
- You may need to re-grant Full Disk Access for the new identifier

### Debugging

To see debug output, run the app binary directly:
```bash
./src-tauri/target/debug/bundle/macos/Backchannel.app/Contents/MacOS/Backchannel
```

Or add file-based logging (logs can't write to `/tmp` when sandboxed):
```rust
let home = std::env::var("HOME").unwrap_or_default();
let path = format!("{}/Desktop/backchannel_debug.log", home);
```

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Rust + Tauri
- **Database**: SQLite (reading macOS Messages database)
- **AI**: OpenRouter API for summarization and analysis
