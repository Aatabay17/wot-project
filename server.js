const { Servient } = require("@node-wot/core");
const { HttpServer } = require("@node-wot/binding-http");
const { CoapServer } = require("@node-wot/binding-coap");
const { MqttBrokerServer } = require("@node-wot/binding-mqtt");
const mqtt = require("mqtt");

const servient = new Servient();
servient.addServer(new HttpServer());
servient.addServer(new CoapServer());
servient.addServer(new MqttBrokerServer({ uri: "mqtt://localhost:1883" 
}));

const mqttClient = mqtt.connect("mqtt://localhost:1883");
mqttClient.on("connect", () => console.log("Connected to MQTT broker"));

servient.start().then(async (WoT) => {
  // --- Temperature Sensor ---
  const tempThing = await WoT.produce({
    title: "Temperature Sensor",
    properties: {
      temperature: {
        type: "number",
        observable: true,
        readOnly: true,
        forms: [
          {
            href: 
"http://localhost:8080/temperature-sensor/properties/temperature",
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
        forms: [
          {
            href: 
"http://localhost:8080/temperature-sensor/actions/reset",
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

  let tempValue = 25.0;

  tempThing.setPropertyReadHandler("temperature", () => tempValue);

  tempThing.setActionHandler("reset", () => {
    tempValue = 0;
    console.log("Sensor reset!");
  });

  setInterval(() => {
    const oldTemp = tempValue;
    tempValue = +(tempValue + (Math.random() - 0.5)).toFixed(1);
    if (tempValue !== oldTemp) {
      mqttClient.publish(
        "temperature-sensor/temperature",
        JSON.stringify(tempValue)
      );
      tempThing.emitPropertyChange("temperature");
      console.log(`New temperature: ${tempValue}`);
    }
  }, 10000);

  await tempThing.expose();
  console.log("Temperature Sensor exposed");

  // --- Smart Light ---
  const lightThing = await WoT.produce({
    title: "Smart Light",
    properties: {
      status: {
        type: "string",
        enum: ["on", "off"],
        readOnly: false,
        observable: true,
        forms: [
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
        forms: [
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

  let lightStatus = "off";

  lightThing.setPropertyReadHandler("status", () => lightStatus);
  lightThing.setPropertyWriteHandler("status", async (interaction) => {
    const value = await interaction.value();
    lightStatus = value;
    console.log("Light status set to:", lightStatus);
  });

  lightThing.setActionHandler("toggle", async () => {
    lightStatus = lightStatus === "on" ? "off" : "on";
    lightThing.emitPropertyChange("status");
    console.log("Light toggled to:", lightStatus);
  });

  await lightThing.expose();
  console.log("Smart Light exposed");
});

