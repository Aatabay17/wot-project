const { Servient } = require("@node-wot/core");
const { HttpClientFactory } = require("@node-wot/binding-http");
const { CoapClientFactory } = require("@node-wot/binding-coap");
const { MqttClientFactory } = require("@node-wot/binding-mqtt");

async function run() {
  const servient = new Servient();
  servient.addClientFactory(new HttpClientFactory());
  servient.addClientFactory(new CoapClientFactory());
  servient.addClientFactory(new MqttClientFactory());

  const WoT = await servient.start();

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
          },
          {
            "href": "mqtt://localhost/temperature-sensor/temperature",
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
          },
          {
            "href": "mqtt://localhost/temperature-sensor/reset",
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

    // Читаем текущую температуру
    const temp = await thing.readProperty("temperature");
    console.log(`Current temperature: ${temp}`);

    // Наблюдаем обновления температуры
    let lastValue = null;
    let lastTime = 0;

    await thing.observeProperty(
      "temperature",
      (data) => {
        if (data !== lastValue && Date.now() - lastTime > 10000) {
          console.log(`Temperature update: ${data}`);
          lastValue = data;
          lastTime = Date.now();
        }
      },
      (err) => console.error("Observe error:", err),
      { contentType: "application/json" }
    );

    // Вызов reset через 5 секунд
    setTimeout(async () => {
      await thing.invokeAction("reset");
      console.log("Sensor reset");
    }, 5000);

  } catch (err) {
    console.error("Error:", err);
  }
}

run();

