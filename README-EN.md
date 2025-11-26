# Chrome Simple Navigator

**Languages:** [English](./README-EN.md) | [简体中文](./README-ZH-CN.md) | [Bilingual / 双语](./README.md)

Welcome to **Chrome Simple Navigator**, a lightweight browser extension that enhances your browsing experience with **customizable keyboard shortcuts** for seamless **cross-tab** level `forward/backward` navigation experience.

## 🎯 Features

- **Smart Backward Navigation**: Press `Alt + Left` (Windows/Linux) or `Command + Left` (macOS) to navigate back in page history. If no history exists, a confirmation prompt will appear. Press the shortcut twice to close the current tab.

- **Smart Forward Navigation**: Press `Alt + Right` (Windows/Linux) or `Command + Right` (macOS) to navigate forward in page history. If forward navigation is unavailable, press the shortcut twice to restore the last closed tab.

- **Intelligent Tab Management**: When closing a tab that was restored via forward navigation, automatically returns to the original tab you were on before the restore.

- **User-Friendly Notifications**: In-page toast notifications (not system notifications) inform you when confirmation is needed for actions.

- **Multi-language Support**: Automatically displays in English or Simplified Chinese based on your browser's language settings.

- **Works on Regular Web Pages**: Compatible with standard `http://` and `https://` pages (system pages like `chrome://` are not supported due to browser restrictions).

## 🚀 Installation

### Manual Installation

1. **Download or Clone** this repository to your local machine

2. **Open Chrome** and navigate to `chrome://extensions/`

3. **Enable Developer Mode** by toggling the switch in the top-right corner

4. **Click "Load unpacked"** button

5. **Select** the extension directory (project root folder)

6. The extension should now appear in your extensions list and be active

7. Back to your page and refresh

### Permissions

The extension is completely offline and does not send any data to servers, ensuring privacy and security.
The extension requires the following permissions:

- `tabs` - To navigate browser history and manage tabs
- `sessions` - To restore recently closed tabs
- `activeTab` - To interact with the current active tab
- `scripting` - To inject content scripts for keyboard handling
- `storage` - To save extension preferences

## 📖 Usage

### Basic Navigation

- **`Alt + Left` / `Command + Left`**: Navigate backward in page history

- **`Alt + Right` / `Command + Right`**: Navigate forward in page history

- Keyboard shortcuts can be customized in the configuration

### Advanced Usage

#### Closing a Tab

1. Press `Alt + Left` (Windows/Linux) or `Command + Left` (macOS) when at the beginning of page history

2. A toast notification will appear: "Press back again to close this tab"

3. Press the shortcut again within the configured delay (default 1 second) to confirm and close the tab

#### Restoring Closed Tabs

1. Press `Alt + Right` (Windows/Linux) or `Command + Right` (macOS) when no forward history is available

2. A toast notification will appear: "Press forward again to reopen last tab"

3. Press the shortcut again within the configured delay to confirm and restore the last closed tab

#### Returning to Original Tab

When you close a tab that was restored via `Alt + Right` / `Command + Right`, the extension automatically switches back to the original tab you were on before the restore operation.

## ⚙️ Configuration

Access the extension options by:

1. Right-click the extension icon in Chrome toolbar

2. Select "Options"

3. Configure your preferences:
   - **Tab Operations** - Enable/disable tab close and reopen features
   - **Toast Notifications** - Enable/disable confirmation prompts and adjust delay time
   - **Keyboard Shortcuts** - Customize shortcuts via Chrome's shortcut settings
   - **Navigation Log** - View recent navigation actions in the popup

## 🔧 Development

### Project Structure

```
chrome_extension/
├── manifest.json          # Extension manifest configuration
├── _locales/              # Internationalization
│   ├── en/                # English translations
│   │   └── messages.json
│   └── zh_CN/             # Chinese translations
│       └── messages.json
├── src/
│   ├── background/        # Service worker (background scripts)
│   │   └── index.js
│   ├── content/           # Content scripts (injected into web pages)
│   │   └── toast.js
│   ├── popup/             # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── options/           # Options page
│       ├── options.html
│       ├── options.css
│       └── options.js
└── assets/
    └── icons/             # Extension icons
```

### Building

This extension uses Manifest V3 and doesn't require a build step. Simply load the unpacked extension directory in Chrome for development.

### Testing

1. Load the extension in developer mode

2. Navigate to any regular web page (not `chrome://` pages)

3. Test keyboard shortcuts and verify navigation behavior

4. Check the browser console for debug logs (prefixed with `[background]`)

## ⚠️ Limitations

- **Confirmation Timeout**: Confirmation prompts expire after the configured delay (default 1 second)

- **Single Session**: Tab restoration mapping is cleared when tabs are removed or the browser is restarted

## 📝 License

This project is open source and available for personal and educational use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit pull requests.

## 📧 Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Enjoy seamless browsing with Chrome Simple Navigator!** 🎉
