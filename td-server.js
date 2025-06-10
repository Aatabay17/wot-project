// Импортируем модули
const express = require("express"); // Фреймворк для создания HTTP-сервера
const fs = require("fs"); // Модуль для работы с файловой системой
const path = require("path"); // Модуль для корректной работы с путями

const app = express(); // Создаём экземпляр express-приложения
const port = 8081; // Устанавливаем порт, на котором будет работать TD-сервер

// Определяем путь к папке с TD-файлами (Thing Descriptions)
const tdDir = path.join(__dirname, "td");

// Объект для хранения всех загруженных TD
let tds = {};

// Функция загрузки всех TD-файлов из папки "td"
function loadTDs() {
  tds = {}; // Очищаем текущий список

  // Получаем список файлов в папке
  const files = fs.readdirSync(tdDir);

  // Обрабатываем каждый файл
  files.forEach(file => {
    if (file.endsWith(".td.json")) { // Только файлы с расширением .td.json
      const filePath = path.join(tdDir, file);

      // Удаляем модуль из кеша require, чтобы можно было перезагрузить файл без перезапуска сервера
      delete require.cache[require.resolve(filePath)];

      const td = require(filePath); // Загружаем JSON-файл

      // Имя TD будет идентификатором (без .td.json)
      const id = path.basename(file, ".td.json");

      // Сохраняем TD в объект по ID
      tds[id] = td;
    }
  });
}
loadTDs(); // Загружаем TD сразу при запуске сервера

// --- Маршруты (эндпоинты) ---

// Эндпоинт для получения конкретного TD по ID
// Пример: GET http://localhost:8081/things/temperature-sensor
app.get("/things/:id", (req, res) => {
  const id = req.params.id; // Извлекаем ID из URL
  if (tds[id]) {
    res.json(tds[id]); // Возвращаем TD в формате JSON
  } else {
    res.status(404).send("Thing not found"); // Если TD не найден — ошибка 404
  }
});

// Эндпоинт для получения списка всех TD
// Пример: GET http://localhost:8081/things
app.get("/things", (req, res) => {
  const list = Object.entries(tds).map(([id, td]) => ({ id, td }));
  res.json(list); // Возвращаем список всех TD с их ID
});

// Обслуживание статических файлов из папки "public"
// Например, HTML-интерфейс, если есть
app.use(express.static("public"));

// Запускаем HTTP-сервер на порту 8081
app.listen(port, () => {
  console.log(`TD server listening at http://localhost:${port}`);
});
