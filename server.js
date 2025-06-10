// Импортируем необходимые модули из node-wot и соответствующих привязок (bindings)
const { Servient } = require("@node-wot/core"); // Основной объект WoT
const { HttpServer } = require("@node-wot/binding-http"); // HTTP-протокол
const { CoapServer } = require("@node-wot/binding-coap"); // CoAP-протокол
const { MqttBrokerServer } = require("@node-wot/binding-mqtt"); // MQTT-протокол
const mqtt = require("mqtt"); // MQTT-клиент для отправки сообщений вручную

// Создаём экземпляр Servient — это "сервер вещей"
const servient = new Servient();

// Добавляем поддержку протоколов: HTTP, CoAP, MQTT
servient.addServer(new HttpServer());
servient.addServer(new CoapServer());
servient.addServer(new MqttBrokerServer({ uri: "mqtt://localhost:1883" }));

// Подключаемся к MQTT брокеру, чтобы вручную публиковать значения
const mqttClient = mqtt.connect("mqtt://localhost:1883");
mqttClient.on("connect", () => console.log("Connected to MQTT broker"));

// Запускаем Servient
servient.start().then(async (WoT) => {
  // --- Temperature Sensor ---
  // Описываем "умную вещь" — датчик температуры
  const tempThing = await WoT.produce({
    title: "Temperature Sensor", // Название устройства
    properties: {
      temperature: {
        type: "number", // Тип данных — число
        observable: true, // Свойство можно "наблюдать"
        readOnly: true, // Только для чтения
        forms: [ // Поддерживаемые протоколы и их URL'ы
          {
            href: "http://localhost:8080/temperature-sensor/properties/temperature",
            contentType: "application/json",
            op: ["readproperty", "observeproperty"]
          },
          {
            href: "coap://localhost:5683/temp",
            contentType: "application/json",
            op: ["readproperty", "observeproperty"]
          },
          {
            href: "mqtt://localhost:1883/temperature-sensor/temperature",
            contentType: "application/json",
            op: ["readproperty", "observeproperty"]
          }
        ]
      }
    },
    actions: {
      reset: {
        forms: [ // Действие reset через все 3 протокола
          {
            href: "http://localhost:8080/temperature-sensor/actions/reset",
            contentType: "application/json",
            op: ["invokeaction"]
          },
          {
            href: "coap://localhost:5683/reset",
            contentType: "application/json",
            op: ["invokeaction"]
          },
          {
            href: "mqtt://localhost:1883/temperature-sensor/reset",
            contentType: "application/json",
            op: ["invokeaction"]
          }
        ]
      }
    }
  });

  let tempValue = 25.0; // Начальное значение температуры

  // Обработчик чтения значения температуры
  tempThing.setPropertyReadHandler("temperature", () => tempValue);

  // Обработчик действия "reset" — сброс температуры в 0
  tempThing.setActionHandler("reset", () => {
    tempValue = 0;
    console.log("Sensor reset!");
  });

  // Каждые 10 секунд обновляем значение температуры и отправляем его по MQTT
  setInterval(() => {
    const oldTemp = tempValue;
    tempValue = +(tempValue + (Math.random() - 0.5)).toFixed(1); // небольшое изменение
    if (tempValue !== oldTemp) {
      // Отправляем новое значение по MQTT
      mqttClient.publish(
        "temperature-sensor/temperature",
        JSON.stringify(tempValue)
      );
      // Уведомляем подписчиков о том, что свойство изменилось
      tempThing.emitPropertyChange("temperature");
      console.log(`New temperature: ${tempValue}`);
    }
  }, 10000); // раз в 10 секунд

  // Публикуем (делаем доступной) вещь
  await tempThing.expose();
  console.log("Temperature Sensor exposed");

  // --- Smart Light ---
  // Описываем "умную вещь" — лампочку
  const lightThing = await WoT.produce({
    title: "Smart Light", // Название устройства
    properties: {
      status: {
        type: "string",
        enum: ["on", "off"], // Возможные значения
        readOnly: false, // Можно читать и записывать
        observable: true, // Поддержка наблюдения
        forms: [ // Доступ через HTTP, CoAP, MQTT
          {
            href: "http://localhost:8080/smart-light/properties/status",
            contentType: "application/json",
            op: ["readproperty", "writeproperty", "observeproperty"]
          },
          {
            href: "coap://localhost:5683/smart-light/status",
            contentType: "application/json",
            op: ["readproperty", "writeproperty", "observeproperty"]
          },
          {
            href: "mqtt://localhost:1883/smart-light/status",
            contentType: "application/json",
            op: ["readproperty", "writeproperty", "observeproperty"]
          }
        ]
      }
    },
    actions: {
      toggle: {
        forms: [ // Действие toggle (переключить лампу)
          {
            href: "http://localhost:8080/smart-light/actions/toggle",
            contentType: "application/json",
            op: ["invokeaction"]
          },
          {
            href: "coap://localhost:5683/smart-light/toggle",
            contentType: "application/json",
            op: ["invokeaction"]
          },
          {
            href: "mqtt://localhost:1883/smart-light/toggle",
            contentType: "application/json",
            op: ["invokeaction"]
          }
        ]
      }
    }
  });

  let lightStatus = "off"; // Начальное состояние лампы — выключена

  // Обработчик чтения свойства "status"
  lightThing.setPropertyReadHandler("status", () => lightStatus);

  // Обработчик записи в свойство "status"
  lightThing.setPropertyWriteHandler("status", async (interaction) => {
    const value = await interaction.value(); // Получаем новое значение
    lightStatus = value;
    console.log("Light status set to:", lightStatus);
  });

  // Обработчик действия toggle (переключить лампу)
  lightThing.setActionHandler("toggle", async () => {
    lightStatus = lightStatus === "on" ? "off" : "on"; // Переключаем состояние
    lightThing.emitPropertyChange("status"); // Уведомляем об изменении
    console.log("Light toggled to:", lightStatus);
  });

  // Публикуем (делаем доступной) лампу
  await lightThing.expose();
  console.log("Smart Light exposed");
});
