import puppeteer from "puppeteer";
import fs from "fs";

interface Speaker {
  name?: string | null;
  role?: string | null;
  company?: string | null;
  linkedIn?: string | null;
  twitter?: string | null;
}

const main = async () => {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: false,
  });

  // Create a page
  const _page = await browser.newPage();

  // Go to your site
  await _page.goto("https://www.parisblockchainweek2024.com/speakers", {
    waitUntil: "domcontentloaded",
  });

  await _page.waitForSelector(".speaker-item");

  // Get page data
  const speakerItems = await _page.evaluate(() => {
    let speakerUrls: string[] = [];

    document.querySelectorAll(".speaker-item a").forEach((el) => {
      el.getAttribute("href") &&
        !speakerUrls.includes(el.getAttribute("href") as string) &&
        speakerUrls.push(el.getAttribute("href") as string);
    });

    return speakerUrls;

    // Fetch the sub-elements from the previously fetched quote element
    // Get the displayed text and return it (`.innerText`)
    // const text = quote.querySelector(".text").innerText;
    // const author = quote.querySelector(".author").innerText;
  });

  const allSpeakers: Speaker[] = [];

  const getSpeakerData = async (url: string) => {
    const page = await browser.newPage();
    await page.goto(`https://www.parisblockchainweek2024.com${url}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector("#ct-eventuserdetail");
    const data = await page.evaluate(async () => {
      const name = document.querySelector(
        "#ct-eventuserdetail h1"
      )?.textContent;
      const subitems1 = document.querySelectorAll("#ct-eventuserdetail h4");
      const company = subitems1[0]?.textContent;
      const role = subitems1[1]?.textContent;
      const subitems2 = document.querySelectorAll(
        "#ct-eventuserdetail .sociallinks .sociallink"
      );
      const twitter = subitems2[0]?.textContent?.includes("twitter.com")
        ? subitems2[0]?.textContent
        : subitems2[1]?.textContent?.includes("twitter.com")
        ? subitems2[1]?.textContent
        : null;
      const linkedIn = subitems2[0]?.textContent?.includes("linkedin.com")
        ? subitems2[0]?.textContent
        : subitems2[1]?.textContent?.includes("linkedin.com")
        ? subitems2[1]?.textContent
        : null;
      return {
        name,
        company,
        role,
        twitter,
        linkedIn,
      };
    });
    console.log(data);
    allSpeakers.push(data);
    await page.close();
  };

  const speakerFns = speakerItems.map((url) => () => getSpeakerData(url));

  for (const fn of speakerFns) {
    await fn();
  }

  // Close browser.
  await browser.close();

  function convertArrayToCSV(arrayOfObjects: Speaker[]) {
    if (arrayOfObjects.length === 0) return "";

    // Get all keys from the first object, assuming all objects have the same structure
    const headers = Object.keys(arrayOfObjects[0]);

    // Map each object to a CSV row
    const rows = arrayOfObjects.map((obj) => {
      // Map each key to its value, escaping quotes and handling undefined/null
      return headers
        .map((header) => {
          // @ts-ignore
          const escaped = ("" + (obj[header] || "")).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",");
    });

    // Combine headers and rows, with each row on a new line
    return [headers.join(","), ...rows].join("\n");
  }

  const csvString = convertArrayToCSV(allSpeakers);

  await fs.writeFileSync("pbw-2024-speakers.csv", csvString);
};

main();
