const fs = require("node:fs/promises");
const path = require("node:path");
const logger = require("./logger");

module.exports = async function loadFiles(dirName) {
  const dirPath = path.resolve(process.cwd(), dirName);
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return await readDirRecursively(dirPath);
  } catch (error) {
    logger.error(`Error loading files from ${dirPath}: ${error.message}`, error);
  }
};

async function readDirRecursively(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const allFiles = await Promise.all(
      entries.map(async (file) => {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) return readDirRecursively(fullPath);
        else if (fullPath.endsWith(".js")) return fullPath;
        else return null;
      })
    );
    return allFiles.flat().filter(Boolean);
  } catch (error) {
    logger.error(`Error reading directory ${dirPath}: ${error.message}`, error);
  }
}
