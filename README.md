# Chrome Simple Navigator

**Languages / 语言选择:** [English](./README-EN.md) | [简体中文](./README-ZH-CN.md)

Welcome to **Chrome Simple Navigator**, a lightweight browser extension that enhances your browsing experience with **customizable keyboard shortcuts** for seamless **cross-tab** level `forward/backward` navigation experience.

欢迎使用 **Chrome Simple Navigator**，这是一款轻量级浏览器扩展，通过**可自定义的键盘快捷键**增强您的浏览体验，实现**跨标签页**级别的 `前进/后退` 导航体验。

## Interface / 界面

1. Settings / 设置
   ![](https://zyxh-1317327611.cos.ap-guangzhou.myqcloud.com/ob/20251126145001.png)

2. Navigation Log / 导航日志
   ![](https://zyxh-1317327611.cos.ap-guangzhou.myqcloud.com/ob/20251126145125.png)

3. Keyboard Shortcuts Configuration / 快捷键配置
   ![](https://zyxh-1317327611.cos.ap-guangzhou.myqcloud.com/ob/20251126145234.png)

## 🎯 Features / 功能特性

- **Smart Backward Navigation**: Press `Alt + Left` (Windows/Linux) or `Command + Left` (macOS) to navigate back in page history. If no history exists, a confirmation prompt will appear. Press the shortcut twice to close the current tab.
  
  **智能后退导航**：按 `Alt + Left`（Windows/Linux）或 `Command + Left`（macOS）在页面历史中后退。如果没有历史记录，将出现确认提示。再次按快捷键可关闭当前标签页。

- **Smart Forward Navigation**: Press `Alt + Right` (Windows/Linux) or `Command + Right` (macOS) to navigate forward in page history. If forward navigation is unavailable, press the shortcut twice to restore the last closed tab.
  
  **智能前进导航**：按 `Alt + Right`（Windows/Linux）或 `Command + Right`（macOS）在页面历史中前进。如果无法前进，再次按快捷键可恢复最后关闭的标签页。

- **Intelligent Tab Management**: When closing a tab that was restored via forward navigation, automatically returns to the original tab you were on before the restore.
  
  **智能标签页管理**：当关闭通过前进导航恢复的标签页时，自动返回到恢复操作前的原始标签页。

- **User-Friendly Notifications**: In-page toast notifications (not system notifications) inform you when confirmation is needed for actions.
  
  **友好的通知提示**：页面内的弹窗通知（非系统通知）会在需要确认操作时提醒您。

- **Multi-language Support**: Automatically displays in English or Simplified Chinese based on your browser's language settings.
  
  **多语言支持**：根据浏览器语言设置自动显示英文或简体中文。

- **Works on Regular Web Pages**: Compatible with standard `http://` and `https://` pages (system pages like `chrome://` are not supported due to browser restrictions).
  
  **适用于常规网页**：兼容标准的 `http://` 和 `https://` 页面（由于浏览器限制，不支持 `chrome://` 等系统页面）。

## 🚀 Installation / 安装

### Manual Installation / 手动安装

1. **Download or Clone** this repository to your local machine
   
   **下载或克隆**此仓库到本地

2. **Open Chrome** and navigate to `chrome://extensions/`
   
   **打开 Chrome** 并访问 `chrome://extensions/`

3. **Enable Developer Mode** by toggling the switch in the top-right corner
   
   **启用开发者模式**，点击右上角的开关

4. **Click "Load unpacked"** button
   
   **点击"加载已解压的扩展程序"**按钮

5. **Select** the extension directory (project root folder)
   
   **选择**扩展目录（项目根文件夹）

6. The extension should now appear in your extensions list and be active
   
   扩展现在应该出现在扩展列表中并处于激活状态

7. Back to your page and refresh
   
   返回页面并刷新

### Permissions / 权限说明

The extension is completely offline and does not send any data to servers, ensuring privacy and security.
插件完全离线，不会向任何服务器发送数据，确保隐私安全
The extension requires the following permissions:

扩展需要以下权限：

- `tabs` - To navigate browser history and manage tabs / 用于导航浏览器历史记录和管理标签页
- `sessions` - To restore recently closed tabs / 用于恢复最近关闭的标签页
- `activeTab` - To interact with the current active tab / 用于与当前活动标签页交互
- `scripting` - To inject content scripts for keyboard handling / 用于注入内容脚本以处理键盘事件
- `storage` - To save extension preferences / 用于保存扩展首选项

## 📖 Usage / 使用说明

### Basic Navigation / 基本导航

- **`Alt + Left` / `Command + Left`**: Navigate backward in page history
  
  **后退导航**：在页面历史中后退

- **`Alt + Right` / `Command + Right`**: Navigate forward in page history
  
  **前进导航**：在页面历史中前进

- Keyboard shortcuts can be customized in the configuration
  
  - 可在配置中自定义键盘快捷键

### Advanced Usage / 高级用法

#### Closing a Tab / 关闭标签页

1. Press `Alt + Left` (Windows/Linux) or `Command + Left` (macOS) when at the beginning of page history
   
   当处于页面历史记录的起始位置时，按 `Alt + Left`（Windows/Linux）或 `Command + Left`（macOS）

2. A toast notification will appear: "Press back again to close this tab"
   
   将出现弹窗通知："再次按后退以关闭此标签页"

3. Press the shortcut again within the configured delay (default 1 second) to confirm and close the tab
   
   在配置的延迟时间内（默认 1 秒）再次按快捷键以确认并关闭标签页

#### Restoring Closed Tabs / 恢复已关闭的标签页

1. Press `Alt + Right` (Windows/Linux) or `Command + Right` (macOS) when no forward history is available
   
   当没有可用的前进历史记录时，按 `Alt + Right`（Windows/Linux）或 `Command + Right`（macOS）

2. A toast notification will appear: "Press forward again to reopen last tab"
   
   将出现弹窗通知："再次按前进以重新打开最后的标签页"

3. Press the shortcut again within the configured delay to confirm and restore the last closed tab
   
   在配置的延迟时间内再次按快捷键以确认并恢复最后关闭的标签页

#### Returning to Original Tab / 返回原始标签页

When you close a tab that was restored via `Alt + Right` / `Command + Right`, the extension automatically switches back to the original tab you were on before the restore operation.

当关闭通过 `Alt + Right` / `Command + Right` 恢复的标签页时，扩展会自动切换回执行恢复操作前的原始标签页。

## ⚙️ Configuration / 配置选项

Access the extension options by:

访问扩展选项：

1. Right-click the extension icon in Chrome toolbar
   
   右键点击 Chrome 工具栏中的扩展图标

2. Select "Options"
   
   选择"选项"

3. Configure your preferences:
   
   配置您的首选项：
   - **Tab Operations** - Enable/disable tab close and reopen features / **标签页操作** - 启用/禁用标签页关闭和重新打开功能
   - **Toast Notifications** - Enable/disable confirmation prompts and adjust delay time / **弹窗通知** - 启用/禁用确认提示并调整延迟时间
   - **Keyboard Shortcuts** - Customize shortcuts via Chrome's shortcut settings / **键盘快捷键** - 通过 Chrome 的快捷键设置自定义快捷键
   - **Navigation Log** - View recent navigation actions in the popup / **导航日志** - 在弹窗中查看最近的导航操作

## 🔧 Development / 开发

### Project Structure / 项目结构

```
chrome_extension/
├── manifest.json          # Extension manifest configuration / 扩展清单配置
├── _locales/              # Internationalization / 国际化
│   ├── en/                # English translations / 英文翻译
│   │   └── messages.json
│   └── zh_CN/             # Chinese translations / 中文翻译
│       └── messages.json
├── src/
│   ├── background/        # Service worker (background scripts) / 服务工作线程（后台脚本）
│   │   └── index.js
│   ├── content/           # Content scripts (injected into web pages) / 内容脚本（注入网页）
│   │   └── toast.js
│   ├── popup/             # Extension popup UI / 扩展弹窗界面
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── options/           # Options page / 选项页面
│       ├── options.html
│       ├── options.css
│       └── options.js
└── assets/
    └── icons/             # Extension icons / 扩展图标
```

### Building / 构建

This extension uses Manifest V3 and doesn't require a build step. Simply load the unpacked extension directory in Chrome for development.

此扩展使用 Manifest V3，无需构建步骤。只需在 Chrome 中加载未打包的扩展目录即可进行开发。

### Testing / 测试

1. Load the extension in developer mode
   
   在开发者模式下加载扩展

2. Navigate to any regular web page (not `chrome://` pages)
   
   导航到任何常规网页（不是 `chrome://` 页面）

3. Test keyboard shortcuts and verify navigation behavior
   
   测试键盘快捷键并验证导航行为

4. Check the browser console for debug logs (prefixed with `[background]`)
   
   检查浏览器控制台的调试日志（以 `[background]` 为前缀）

## ⚠️ Limitations / 限制

- **Confirmation Timeout**: Confirmation prompts expire after the configured delay (default 1 second)
  
  **确认超时**：确认提示会在配置的延迟时间后过期（默认 1 秒）

- **Single Session**: Tab restoration mapping is cleared when tabs are removed or the browser is restarted
  
  **单次会话**：当标签页被移除或浏览器重启时，标签页恢复映射会被清除

## 📝 License / 许可证

This project is open source and available for personal and educational use.

本项目为开源项目，可用于个人和教育用途。

## 🤝 Contributing / 贡献

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit pull requests.

欢迎贡献代码、提出问题和功能请求！请随时查看问题页面或提交拉取请求。

## 📧 Support / 支持

For issues, questions, or suggestions, please open an issue on the repository.

如有问题、疑问或建议，请在仓库中提交问题。

---

**Enjoy seamless browsing with Chrome Simple Navigator!** 🎉

**享受 Chrome Simple Navigator 带来的无缝浏览体验！** 🎉
