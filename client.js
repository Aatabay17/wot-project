const { Servient } = require("@node-wot/core");
const { HttpClientFactory } = require("@node-wot/binding-http");
const { CoapClientFactory } = require("@node-wot/binding-coap");

async function run() {
  const servient = new Servient();
  servient.addClientFactory(new HttpClientFactory());
  servient.addClientFactory(new CoapClientFactory());

  const WoT = await servient.start();

  // Thing Description
  const td = {
    "@context": "https://www.w3.org/2019/wot/td/v1",
    "id": "urn:dev:ops:temperature-sensor-123",
    "title": "Temperature Sensor",
    "properties": {
      "temperature": {
        "type": "number",
        "readOnly": true,
        "observable": true,
        "forms": [
          {
            "href": 
"http://172.25.125.169:8080/temperature-sensor/properties/temperature",
            "contentType": "application/json",
            "op": ["readproperty", "observeproperty"]
          },
          {
            "href": "coap://172.25.125.169:5683/temp",
            "contentType": "application/json",
            "op": ["readproperty", "observeproperty"]
          }
        ]
      }
    },
    "actions": {
      "reset": {
        "forms": [
          {
            "href": 
"http://172.25.125.169:8080/temperature-sensor/actions/reset",
            "contentType": "application/json",
            "op": ["invokeaction"]
          },
          {
            "href": "coap://172.25.125.169:5683/reset",
            "contentType": "application/json",
            "op": ["invokeaction"]
          }
        ]
      }
    }
  };

  try {
    const thing = await WoT.consume(td);
    console.log("Connected to Thing");

    // Чтение текущей температуры
    const tempData = await thing.readProperty("temperature");
    const temp = await tempData.value();
    console.log(`Current temperature: ${temp}`);

    // Подписка на обновления
    let lastValue = null;
    let lastTime = 0;

    await thing.observeProperty(
      "temperature",
      async (data) => {
        const val = await data.value();
        const now = Date.now();

        // Показываем только если значение изменилось и прошло 10 секунд
        if (val !== lastValue && now - lastTime >= 10_000) {
          console.log(`Temperature update: ${val}`);
          lastValue = val;
          lastTime = now;
        }
      },
      (err) => console.error("Observe error:", err),
      { contentType: "application/json" }
    );

    // Вызов действия reset через 5 секунд
    setTimeout(async () => {
      await thing.invokeAction("reset");
      console.log("Sensor reset");
    }, 5000);

  } catch (err) {
    console.error("Error:", err);
  }
}

run();

