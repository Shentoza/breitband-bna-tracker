import { promises as fs } from "fs";
import { resolve } from "path";
import puppeteer from "puppeteer";
import { EXPORT_PATH, BASE_URL, EXECUTABLE_PATH } from "./config.js";

export async function RunSpeedtest(onSuccess = async (filePath) => {
  console.log(`Speedtest completed. CSV file at: ${filePath}`);
}) {
  try {
    const browser = await puppeteer.launch({
      EXECUTABLE_PATH,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(BASE_URL, []);
    const page = await browser.newPage();
    await page.setViewport({
      width: 2024,
      height: 2024,
      deviceScaleFactor: 1,
    });

    const client = await page.createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: EXPORT_PATH,
    });
    
    try {
      //open website and wait till it is loaded
      await Promise.all([
        page.goto(`${BASE_URL}/test`),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
      
      await clickButton(browser, page, selectors.start_test);
      await clickButton(browser, page, selectors.accept_policy);
      console.log("Running Speedtest");
      try {
        await page.waitForSelector(selectors.download_results, {
          timeout: 300 * 10 ** 3,
          visible: true,
        });
        console.log("Speedtest finished");
      } catch (err) {
        console.log("could not find results for download");
        console.log(err);
        await browser.close();
        return;
      }
      await clickButton(browser, page, selectors.download_results);
      const newFile = await waitForCsvDownload(EXPORT_PATH, 10);
      if (newFile) {
        onSuccess(newFile.fullpath);
      } else {
      }
      await browser.close();
      return;
    } catch (err) {
      console.log("fatal error");
      console.log(err);
      await browser.close();
      return;
    }
  } catch (error) {
    console.log("Error starting puppeteer");
    console.log(error);
    return;
  }
};

async function waitForCsvDownload(dir, waitInSec = 5) {
  console.log(dir);
  const startFiles = await fs.readdir(dir);
  const startSet = new Set(startFiles);
  let foundFile = null;
  const start = Date.now();
  while (Date.now() - start < (waitInSec*1000)) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (!startSet.has(file) && file.endsWith(".csv")) {
        foundFile = file;
        break;
      }
    }
    await new Promise((res) => setTimeout(res, 500));
    if (foundFile) break;
  }
  if(!foundFile) {
    console.error("Could not find downloaded CSV file within timeout");
    return null;
  }
  return { filename: foundFile, fullpath: resolve(dir, foundFile) };
}

async function clickButton(
  browser,
  page,
  selector,
  timeout = 30,
  visible = true
) {
  try {
    await page.waitForSelector(selector, {
      timeout: timeout * 10 ** 3,
      visible: visible,
    });
    await page.click(selector);
  } catch (err) {
    console.log(`could not click element\nError: ${err}`);
    await page.screenshot({
      path: `${process.env.EXPORT_PATH || "/export/"}/error-screenshot.png`,
    });
    await browser.close();
    process.exit(1);
  }
}

const selectors = {
  start_test: "#root > div > div > div > div > div > button",
  accept_policy:
    "#root > div > div.fade.modal-md.modal.show > div > div > div.justify-content-between.modal-footer > button:nth-child(2)",
  download_results:
    "#root > div > div > div > div > div.messung-options.col.col-12.text-md-right > button.px-0.px-sm-4.btn.btn-link",
};