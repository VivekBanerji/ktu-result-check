# KTU Result Monitor

A Node.js and Playwright automation project that checks the APJ Abdul
Kalam Technological University (KTU) student portal for the **S4 2019
Scheme --- Request/View Review** option and sends status updates to a
Telegram bot.

> **Important:** This tool only checks the portal and sends
> notifications. It does not submit review requests or make changes to
> your KTU account. Use it responsibly and follow the university
> portal's terms and access rules.

## Features

-   Signs in to the KTU portal using credentials stored locally in
    environment variables.
-   Navigates to the examination section and checks the configured S4
    2019 Scheme exam.
-   Sends Telegram status updates after checks.
-   Uses a configurable check interval.
-   Keeps local state in `state.json` to support notification tracking.

## Requirements

-   [Node.js](https://nodejs.org/) (a current LTS version is
    recommended)
-   npm (included with Node.js)
-   A Telegram bot created with [@BotFather](https://t.me/BotFather)
-   Your KTU portal login
-   An internet connection

## Setup

### 1. Install dependencies

Open a terminal in the project directory and run:

``` bash
npm install
npx playwright install chromium
```

### 2. Create your `.env` file

Create a file named `.env` in the project root. Add your own values:

``` dotenv
KTU_USERNAME=your_ktu_username
KTU_PASSWORD=your_ktu_password

TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

CHECK_INTERVAL_MINUTES=60
```

Do not add quotes unless your value requires them. Replace every
placeholder with your own value.

### 3. Find your Telegram chat ID

1.  Open your Telegram bot and press **Start**.
2.  Send it a message, such as `Hello`.
3.  In your browser, open the Telegram Bot API `getUpdates` endpoint
    using your bot token:
    `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4.  Find the `message` object and copy the numeric value from
    `message.chat.id`.
5.  Put that number in `TELEGRAM_CHAT_ID` in `.env`.

If `result` is empty, send another message to your bot and refresh
`getUpdates`. **Never share your bot token or the full API URL
publicly.**

### 4. Start the monitor

``` bash
node monitor.js
```

Leave the terminal process running. In the current local setup,
monitoring stops if you close the process, shut down the computer, or
lose the internet connection.

## Configuration

  ------------------------------------------------------------------------------
  Variable                   Purpose                 Example
  -------------------------- ----------------------- ---------------------------
  `KTU_USERNAME`             KTU portal username     `your_ktu_username`

  `KTU_PASSWORD`             KTU portal password     `your_ktu_password`

  `TELEGRAM_BOT_TOKEN`       Token issued by         `your_telegram_bot_token`
                             BotFather               

  `TELEGRAM_CHAT_ID`         Chat to receive         `123456789`
                             notifications           

  `CHECK_INTERVAL_MINUTES`   Time between checks, if `60`
                             used by the monitor     
                             loop                    
  ------------------------------------------------------------------------------

Use a reasonable check interval. Avoid frequent requests that could put
unnecessary load on the university portal.

## Expected behaviour

After each check, the terminal should show the check time and whether
the review option was found. The Telegram bot should send a status
message when notification delivery is configured.

The portal may log you out, change its page structure, or be temporarily
unavailable. If login or navigation fails, inspect the terminal error
and update the Playwright locators as needed. The bot cannot guarantee
that the portal's information is always current.

## Troubleshooting

-   **No Telegram message:** Check `TELEGRAM_BOT_TOKEN` and
    `TELEGRAM_CHAT_ID`, then send `/start` or a message to your bot.
-   **`getUpdates` returns an empty list:** Send a new message to the
    bot and refresh the endpoint.
-   **Login fails:** Confirm your KTU credentials and check whether the
    portal displays a new prompt or error.
-   **Exam or button not found:** Verify the academic year and exam
    title on the portal. The site may have changed its layout or labels.
-   **Playwright browser missing:** Run
    `npx playwright install chromium`.
-   **Monitor stops:** Keep the terminal process open and check whether
    Node.js reported an error.

## Security and Git

Keep these local files out of Git:

-   `.env` --- contains passwords and Telegram credentials.
-   `state.json` --- local notification state.
-   `node_modules/` --- installed dependencies.
-   `playwright/.auth/` --- may contain saved authenticated browser
    state.

Confirm `.gitignore` includes at least:

``` gitignore
.env
node_modules/
state.json
playwright/.auth/
```

Never commit your KTU password or Telegram bot token. If a token is
accidentally exposed, revoke it through BotFather and update your local
`.env` file.

## Project files

``` text
ktu-result-monitor/
├── .env                 # Local secrets; do not commit
├── .gitignore
├── monitor.js           # Playwright monitoring and Telegram notifications
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Locked dependency versions
└── state.json           # Local state; do not commit
```

## Disclaimer

This is an independent personal automation project and is not affiliated
with or endorsed by KTU. It is provided as-is. Verify important academic
information directly on the official portal.

