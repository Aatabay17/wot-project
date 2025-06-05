const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 8081;

const tdDir = path.join(__dirname, "td");

let tds = {};

// Загружаем все TD из папки td
function loadTDs() {
  tds = {};
  const files = fs.readdirSync(tdDir);
  files.forEach(file => {
    if (file.endsWith(".td.json")) {
      const filePath = path.join(tdDir, file);
      delete require.cache[require.resolve(filePath)];  // очистка кэша 
require
      const td = require(filePath);
      // id из имени файла (без расширения)
      const id = path.basename(file, ".td.json");
      tds[id] = td;
    }
  });
}
loadTDs();

// Эндпоинт для конкретного TD
app.get("/things/:id", (req, res) => {
  const id = req.params.id;
  if (tds[id]) {
    res.json(tds[id]);
  } else {
    res.status(404).send("Thing not found");
  }
});

// Эндпоинт для списка всех TD
app.get("/things", (req, res) => {
  const list = Object.entries(tds).map(([id, td]) => ({ id, td }));
  res.json(list);
});

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`TD server listening at http://localhost:${port}`);
});

