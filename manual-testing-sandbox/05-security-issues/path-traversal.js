// SECURITY FILE: Path traversal vulnerabilities

const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const UPLOAD_DIR = "./uploads";
const STATIC_DIR = "./public";

// VULNERABILITY 1: Direct path concatenation
app.get("/files/:filename", (req, res) => {
  const filename = req.params.filename;
  // VULNERABLE: Path traversal via ../
  const filePath = UPLOAD_DIR + "/" + filename;

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

// VULNERABILITY 2: Query parameter path traversal
app.get("/download", (req, res) => {
  const file = req.query.file;
  // VULNERABLE: No validation of file parameter
  const filePath = path.join(STATIC_DIR, file);
  res.download(filePath);
});

// VULNERABILITY 3: Path in request body
app.post("/read-file", express.json(), (req, res) => {
  const { filepath } = req.body;
  // VULNERABLE: Reading arbitrary files
  try {
    const content = fs.readFileSync(filepath, "utf8");
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 4: Template/view path traversal
app.get("/page/:pageName", (req, res) => {
  const pageName = req.params.pageName;
  // VULNERABLE: Loading arbitrary templates
  res.render(`pages/${pageName}`);
});

// VULNERABILITY 5: File upload with user-controlled path
app.post("/upload", (req, res) => {
  const { filename, content } = req.body;
  // VULNERABLE: User controls the filename/path
  const filePath = path.join(UPLOAD_DIR, filename);

  fs.writeFileSync(filePath, content);
  res.json({ message: "File uploaded", path: filePath });
});

// VULNERABILITY 6: Archive extraction path traversal (Zip Slip)
const AdmZip = require("adm-zip");

app.post("/extract", (req, res) => {
  const zipPath = req.body.zipPath;
  const extractTo = req.body.extractTo || UPLOAD_DIR;

  // VULNERABLE: Zip slip - files in archive can escape extraction directory
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractTo, true);
  res.json({ message: "Extracted successfully" });
});

// VULNERABILITY 7: Symlink following
app.get("/config/:configName", (req, res) => {
  const configName = req.params.configName;
  const configPath = path.join("./configs", configName);

  // VULNERABLE: Follows symlinks, could read files outside configs directory
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf8");
    res.json({ config: JSON.parse(content) });
  } else {
    res.status(404).json({ error: "Config not found" });
  }
});

// VULNERABILITY 8: Include/require path traversal
app.get("/module/:moduleName", (req, res) => {
  const moduleName = req.params.moduleName;
  // VULNERABLE: Loading arbitrary modules
  try {
    const module = require(`./modules/${moduleName}`);
    res.json({ result: module.run() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 9: Delete file with user path
app.delete("/files/:filename", (req, res) => {
  const filename = req.params.filename;
  // VULNERABLE: Deleting arbitrary files
  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    fs.unlinkSync(filePath);
    res.json({ message: "File deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 10: Directory listing with user path
app.get("/list", (req, res) => {
  const directory = req.query.dir || UPLOAD_DIR;
  // VULNERABLE: Listing arbitrary directories
  try {
    const files = fs.readdirSync(directory);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 11: Copy/move file with user paths
app.post("/copy", express.json(), (req, res) => {
  const { source, destination } = req.body;
  // VULNERABLE: Copying files to/from arbitrary locations
  try {
    fs.copyFileSync(source, destination);
    res.json({ message: "File copied" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 12: Create directory with user path
app.post("/mkdir", express.json(), (req, res) => {
  const { dirPath } = req.body;
  // VULNERABLE: Creating directories at arbitrary locations
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    res.json({ message: "Directory created", path: dirPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
