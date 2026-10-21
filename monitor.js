
require("dotenv").config();

const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

// ---------- Configuration ----------

const LOGIN_URL = "https://app.ktu.edu.in/login.htm";
const EXAM_URL =
  "https://app.ktu.edu.in/eu/exm/viewStudentExamDefinition.htm";

const EXAM_TITLE =
  "B.Tech S4 (S, FE) Exam May 2026 (2019 Scheme)";

const INTERVAL_MINUTES = Number(
  process.env.CHECK_INTERVAL_MINUTES || 60
);

const STATE_FILE = path.join(__dirname, "state.json");

// ---------- Persistent state ----------

function readState() {
  try {
    return JSON.parse(
      fs.readFileSync(STATE_FILE, "utf8")
    );
  } catch {
    return { reviewAvailable: false };
  }
}

function saveState(state) {
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(state, null, 2)
  );
}

// ---------- Telegram notification ----------

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error(
      "Telegram configuration missing in .env"
    );
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error("Telegram message failed.");
  }

  console.log("Telegram notification sent.");
}

// ---------- KTU monitoring ----------

async function checkKTU() {
  let browser;

  try {
    console.log(
      "\nChecking KTU:",
      new Date().toLocaleString()
    );

    browser = await chromium.launch({
      headless: false
    });

    const page = await browser.newPage();

    // 1. Open the login page
    await page.goto(LOGIN_URL, {
      waitUntil: "domcontentloaded"
    });

    // 2. Log in
    await page.getByRole("textbox", {
      name: "Enter username"
    }).fill(process.env.KTU_USERNAME);

    await page.getByRole("textbox", {
      name: "Enter password"
    }).fill(process.env.KTU_PASSWORD);

    await page.getByRole("button", {
      name: "Login"
    }).click();

    // Wait for login/navigation to complete
    await page.waitForTimeout(2000);

    // 3. Open Exam section
    await page.getByRole("link", {
      name: "Exam",
      exact: true
    }).click();

    await page.waitForTimeout(1500);

    // 4. Select academic year 2025-2026
    await page.locator("#searchForm_academicYear")
      .selectOption("96");

    await page.waitForTimeout(1500);

    // 5. Ensure the exam page is open
    if (!page.url().includes("viewStudentExamDefinition")) {
      await page.goto(EXAM_URL, {
        waitUntil: "domcontentloaded"
      });
    }

    // 6. Locate the exact S4 exam entry
    const title = page.getByText(EXAM_TITLE, {
      exact: true
    });

    if (await title.count() === 0) {
      throw new Error(
        "S4 exam not found. Check login, academic year and page."
      );
    }

    // Use the same card locator that worked in your test
    const examCard = title.locator(
      "xpath=ancestor::div[.//*[normalize-space()='View/Register Exam Courses']][1]"
    );

    // 7. Check for the review option
    const reviewOption = examCard.getByText(
      "Request/View Review",
      { exact: true }
    );

    const found =
      (await reviewOption.count()) > 0 &&
      await reviewOption.first().isVisible();

    console.log(
      found
        ? "S4 review option FOUND."
        : "S4 review option is not available yet."
    );

    // 8. Notify only when it changes from absent to present
    const state = readState();

    if (found && !state.reviewAvailable) {
      await sendTelegram(
        "🎓 KTU RESULT UPDATE\n\n" +
        "The Request/View Review option has appeared for:\n" +
        EXAM_TITLE +
        "\n\nPlease log in to the official KTU portal " +
        "to verify the option and any applicable deadline."
      );
    }

    // Save only after a successful check and notification
    saveState({
      reviewAvailable: found,
      lastChecked: new Date().toISOString()
    });

    console.log("Check completed successfully.");

  } catch (error) {
    console.error("KTU check failed:", error.message);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// ---------- Hourly scheduler ----------

if (
  !Number.isFinite(INTERVAL_MINUTES) ||
  INTERVAL_MINUTES < 1
) {
  throw new Error(
    "CHECK_INTERVAL_MINUTES must be at least 1."
  );
}

if (!process.env.KTU_USERNAME || !process.env.KTU_PASSWORD) {
  throw new Error("KTU credentials are missing in .env");
}

let checkInProgress = false;

async function runCheck() {
  if (checkInProgress) {
    console.log("Previous check is still running; skipping.");
    return;
  }

  checkInProgress = true;

  try {
    await checkKTU();
  } finally {
    checkInProgress = false;
  }
}

console.log(
  `KTU Result Monitor started. Interval: ${INTERVAL_MINUTES} minutes.`
);

// Run immediately, then repeat
runCheck();

setInterval(
  runCheck,
  INTERVAL_MINUTES * 60 * 1000
);
