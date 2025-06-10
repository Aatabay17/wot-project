// Асинхронная функция для загрузки TD и взаимодействия с вещами
async function loadThings() {
  // Получаем список всех TD с td-server через эндпоинт /things
  const res = await fetch("/things");
  const data = await res.json();

  // Получаем элементы пользовательского интерфейса по ID
  const tempValueEl = document.getElementById("temperature-value");
  const tempUpdatedEl = document.getElementById("temperature-last-updated");
  const resetBtn = document.getElementById("reset-temp");

  const lightStatusEl = document.getElementById("light-status");
  const lightUpdatedEl = document.getElementById("light-last-updated");
  const toggleBtn = document.getElementById("toggle-light");

  const tdTempPre = document.getElementById("td-temp");
  const tdLightPre = document.getElementById("td-light");

  // Ищем TD по ID: temperature-sensor и smart-light
  const tempThing = data.find(d => d.id === "temperature-sensor");
  const lightThing = data.find(d => d.id === "smart-light");

  let lastLightStatus = null; // Переменная для отслеживания предыдущего состояния света

  // Функция для обновления текущего значения температуры
  async function updateTemperature() {
    try {
      const res = await fetch(tempThing.td.properties.temperature.forms[0].href);
      const temp = await res.json();
      tempValueEl.textContent = temp;
      tempUpdatedEl.textContent = new Date().toLocaleTimeString(); // Время последнего обновления
    } catch (e) {
      tempValueEl.textContent = "Error"; // В случае ошибки
    }
  }

  // Функция для обновления статуса света, только если он изменился
  async function updateLightStatus() {
    try {
      const res = await fetch(lightThing.td.properties.status.forms[0].href);
      const status = await res.json();

      // Обновляем UI только если статус изменился
      if (status !== lastLightStatus) {
        lightStatusEl.textContent = status;
        lightStatusEl.style.color = (status === "on") ? "green" :
                                    (status === "off") ? "gray" : "black";
        lightUpdatedEl.textContent = new Date().toLocaleTimeString();
        lastLightStatus = status;
      }
    } catch (e) {
      lightStatusEl.textContent = "Error"; // В случае ошибки
      lightStatusEl.style.color = "red";
    }
  }

  // Обработчик кнопки "reset" для сброса температуры
  resetBtn.onclick = async () => {
    try {
      await fetch(tempThing.td.actions.reset.forms[0].href, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      alert("Temperature sensor reset!");
      await updateTemperature(); // Обновляем значение температуры после сброса
    } catch {
      alert("Failed to reset temperature sensor.");
    }
  };

  // Обработчик кнопки "toggle" для переключения света
  toggleBtn.onclick = async () => {
    try {
      await fetch(lightThing.td.actions.toggle.forms[0].href, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      // Обновляем статус света через секунду после переключения
      setTimeout(updateLightStatus, 1000);
    } catch {
      alert("Failed to toggle light.");
    }
  };

  // Отображаем JSON-описания TD на странице
  tdTempPre.textContent = JSON.stringify(tempThing.td, null, 2);
  tdLightPre.textContent = JSON.stringify(lightThing.td, null, 2);

  // Первичное обновление интерфейса при загрузке
  await updateTemperature();
  await updateLightStatus();

  // Периодическое обновление данных каждые 5 секунд
  setInterval(updateTemperature, 5000);
  setInterval(updateLightStatus, 5000);
}

// Запускаем основную функцию
loadThings();
