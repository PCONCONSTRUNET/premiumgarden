const fs = require("fs");
const path = require("path");

const directoryPath = path.join(__dirname, "src", "routes");
const results = [];

function walk(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith(".tsx")) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Check buttons
    if (line.includes("<Button")) {
      if (
        !line.includes("onClick") &&
        !line.includes('type="submit"') &&
        !line.includes("asChild") &&
        !line.includes("type='submit'")
      ) {
        // Look ahead 2 lines in case it's multiline
        const fullTag = lines.slice(index, index + 3).join(" ");
        if (
          !fullTag.includes("onClick") &&
          !fullTag.includes('type="submit"') &&
          !fullTag.includes("asChild")
        ) {
          results.push(
            `GHOST BUTTON in ${path.basename(filePath)} at line ${index + 1}: ${line.trim()}`,
          );
        }
      }
    }

    // Check Selects
    if (line.includes("<Select") && !line.includes("</Select>")) {
      const fullTag = lines.slice(index, index + 3).join(" ");
      if (
        !fullTag.includes("onValueChange") &&
        !fullTag.includes("defaultValue") &&
        !fullTag.includes("value")
      ) {
        results.push(
          `GHOST SELECT in ${path.basename(filePath)} at line ${index + 1}: ${line.trim()}`,
        );
      }
    }

    // Check Tabs
    if (line.includes("<Tabs ") && !line.includes("defaultValue") && !line.includes("value")) {
      results.push(`GHOST TABS in ${path.basename(filePath)} at line ${index + 1}: ${line.trim()}`);
    }
  });
}

walk(directoryPath);

fs.writeFileSync(
  "C:\\Users\\P-CON CONSTRUNET\\.gemini\\antigravity-ide\\brain\\90648330-aa2b-4db2-912b-bd212956c334\\ghost_report.txt",
  results.join("\n"),
);
console.log("Report generated with " + results.length + " potential issues.");
