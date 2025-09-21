import puppeteer from "puppeteer";
import { promises as fs } from "fs";
import {
  selectors,
  clickButton,
  base_url,
  waitForCsvDownload,
} from "./websitehandling.js";
import dotenv from "dotenv";
import {
  readResultCsv,
  getLatestFile,
  fulfillsRequirement,
} from "./speedtest.js";
import { connectMqtt, publishResult } from "./mqttClient.js";

//config
dotenv.config();
const START_HEADLESS = process.env.START_HEADLESS || true;
const EXPORT_PATH = process.env.EXPORT_PATH || "/export/";

console.log(EXPORT_PATH);
const client = connectMqtt();
(async () => {
  const result = await readResultCsv(
    "D:\\Dev\\Repositories\\breitband\\breitbandmessung\\export\\Breitbandmessung_21_09_2025_20_21_58.csv"
  );
  publishResult(client,{a: 'hi!', b: false});
  return;
  try {
    const browser = await puppeteer.launch({
      // product: "chrome",
      // executablePath: "/usr/bin/chromium",
      headless: START_HEADLESS,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(base_url, []);
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
        page.goto(`${base_url}/test`),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);

      console.log("Starting Speedtest");
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
      const newFile = await waitForCsvDownload(EXPORT_PATH, 5000);
      if (newFile) {
        console.log(`Neue Datei gefunden: ${newFile}`);
      } else {
        console.log("Keine neue Datei im Download-Ordner gefunden.");
      }
      await browser.close();
      console.log(await readResultCsv(EXPORT_PATH + "/" + newFile));
      await fs.chmod(EXPORT_PATH, "777");
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
})();
