# Price to Time Converter 

Ever looked at a price tag and wondered how much of your life you'd have to trade for it? This Chrome extension replaces prices on websites with the actual time it would take for you to earn that amount, giving you a powerful new perspective on your spending.

##  Key Features

- **Real-time Conversion:** Automatically finds and converts prices on most websites you visit.
- **Flexible Income Setup:** Configure your earnings based on hourly, daily, or monthly rates. It even accounts for expenses to calculate your true disposable income.
- **Multiple Currencies:** Natively supports Dollar ($), Bangladeshi Taka (৳), and the BDT currency code.
- **Dual Display Mode:** Choose to either completely replace the price with time (`1h 25m`) or show both side-by-side (`৳500 (1h 25m)`).

## Installation

Since this extension is not yet on the Chrome Web Store, you can install it manually:

1. **Download:** Download this project as a ZIP file and unzip it, or clone the repository.
2. **Open Chrome Extensions:** Open Google Chrome and navigate to `chrome://extensions`.
3. **Enable Developer Mode:** Turn on the "Developer mode" switch in the top-right corner.
4. **Load Unpacked:** Click the "Load unpacked" button and select the folder where you unzipped the project files.
5. **Done!** The extension icon will appear in your browser's toolbar.

##  How to Use

1. **Pin the Extension:** Click the puzzle piece icon in your Chrome toolbar and pin the "Price to Time Converter" for easy access.
2. **Open Settings:** Click the extension's icon to open the settings popup.
3. **Configure Your Income:**
   - Select the Hourly, Daily, or Monthly tab that best matches how you track your income.
   - Fill in the relevant fields (e.g., your hourly rate, or your monthly salary and expenses). The effective hourly rate will be calculated for you.
4. **Enable Conversion:**
   - Click the main toggle switch at the top of the popup to enable the price conversion.
   - Choose your preferred display style: Replace Price or Show Both.
5. **Browse the Web:** Navigate to any website with prices. The extension will automatically convert them based on your settings!

##  Technology Used

- **Manifest V3** for the Chrome Extension framework.
- **HTML5** for the popup structure.
- **CSS3** for styling the popup interface.
- **JavaScript (ES6+)** for all the core logic, including:
  - `chrome.storage.sync` API for saving user settings.
  - `chrome.scripting.executeScript` for injecting the conversion logic.
  - DOM Traversal and `MutationObserver` to handle dynamic content on web pages safely.

## Project Status

- **Current Version:** 1.0
- **Status:** Fully functional prototype.
- **Last major architectural review:** Monday, September 22, 2025, in Dhaka, Bangladesh.




