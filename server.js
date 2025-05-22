const { Servient } = require("@node-wot/core");
const { HttpServer } = require("@node-wot/binding-http");
const { CoapServer } = require("@node-wot/binding-coap");

const servient = new Servient();
servient.addServer(new HttpServer());
servient.addServer(new CoapServer());

servient.start().then(async (WoT) => {
  const thing = await WoT.produce({
    title: "Temperature Sensor",
    properties: {
      temperature: {
        type: "number",
        observable: true,
        readOnly: true,
        forms: [
          {
            href: 
"http://172.25.125.169:8080/temperature-sensor/properties/temperature",
            contentType: "application/json",
            op: ["readproperty", "observeproperty"]
          },
          {
            href: "coap://172.25.125.169:5683/temp",
            contentType: "application/json",
            op: ["readproperty", "observeproperty"]
          }
        ]
      }
    },
    actions: {
      reset: {
        forms: [
          {
            href: 
"http://172.25.125.169:8080/temperature-sensor/actions/reset",
            contentType: "application/json",
            op: ["invokeaction"]
          },
          {
            href: "coap://172.25.125.169:5683/reset",
            contentType: "application/json",
            op: ["invokeaction"]
          }
        ]
      }
    }
  });

  let tempValue = 25.0;

  // Устанавливаем обработчик чтения свойства без forms
  thing.setPropertyReadHandler("temperature", () => tempValue);

  // Обработчик действия reset без forms
  thing.setActionHandler("reset", () => {
    tempValue = 0;
    console.log("Sensor reset!");
  });


  // Периодически обновляем температуру и уведомляем наблюдателей
  setInterval(() => {
     const oldTemp = tempValue;
     tempValue = +(tempValue + (Math.random() - 0.5)).toFixed(1);
     if (tempValue !== oldTemp) {
      thing.emitPropertyChange("temperature");
     }
  }, 10000); // каждые 10 секунд


  await thing.expose();
  console.log("Thing exposed via HTTP & CoAP!");
});

