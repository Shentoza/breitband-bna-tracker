import { promises as fs } from "fs";


export async function getLatestFile(dir) {
  const files = await fs.promises.readdir(dir);
  const fileStats = await Promise.all(
    files.map(async (file) => {
      const stat = await fs.promises.stat(path.join(dir, file));
      return { file, mtime: stat.mtime };
    })
  );
  fileStats.sort((a, b) => b.mtime - a.mtime);
  return fileStats.length ? path.join(dir, fileStats[0].file) : null;
}

export async function fulfillsRequirement(
  { download_speed, upload_speed },
  min_download,
  min_upload
) {
  return download_speed >= min_download && upload_speed >= min_upload;
}