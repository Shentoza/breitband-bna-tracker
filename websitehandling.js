import fs from "fs";

export const selectors = {
  start_test: "#root > div > div > div > div > div > button",
  accept_policy:
    "#root > div > div.fade.modal-md.modal.show > div > div > div.justify-content-between.modal-footer > button:nth-child(2)",
  download_results:
    "#root > div > div > div > div > div.messung-options.col.col-12.text-md-right > button.px-0.px-sm-4.btn.btn-link",
};

export const base_url = "https://breitbandmessung.de";

export async function clickButton(
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


export async function waitForCsvDownload(dir, timeout = 5000) {
      const startFiles = await fs.promises.readdir(dir);
      const startSet = new Set(startFiles);
      let foundFile = null;
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
          if (!startSet.has(file) && file.endsWith(".csv")) {
            foundFile = file;
            break;
          }
        }
        await new Promise((res) => setTimeout(res, 500));
        if (foundFile) break;
      }
      return foundFile;
    }
