# Web of Things Project

## Description

This project implements a simple Web of Things (WoT) architecture with two 
devices:  
- **Temperature Sensor**  
- **Smart Light**

Servers are implemented using Node.js and the 
[node-wot](https://github.com/eclipse/thingweb.node-wot) library. Devices 
are accessible via HTTP, CoAP, and MQTT. There is also a TD server that 
serves Thing Descriptions.

---

## Requirements

- Node.js (recommended version 16 or higher)  
- MQTT broker (e.g., [Mosquitto](https://mosquitto.org/)) running locally 
on port 1883

---

## Installation

1. Clone the repository:  
   ```bash
   git clone <repository-url>
   cd wot-project


2. Install dependencies:
npm install

3. Start the local MQTT broker if not already running.



Running

Start the Things server (Temperature Sensor and Smart Light):
node server.js

Start the TD server (serves Thing Descriptions and static files):
node td-server.js

Testing

TD server endpoint for all Things:
http://localhost:8081/things

TD endpoint for specific Things:
http://localhost:8081/things/temperature-sensor
http://localhost:8081/things/smart-light

Main page with UI:
http://localhost:8081/


Project Structure
wot-project/
├── client.js            # WoT client consuming Things
├── server.js            # Server for Temperature Sensor and Smart 
Light
├── smart-light.js       # Separate Smart Light server (can be merged 
with server.js)
├── td-server.js         # Server serving Thing Descriptions and static 
files
├── package.json
├── package-lock.json
├── td/                  # Folder with TD JSON files
│   ├── temperature-sensor.td.json
│   └── smart-light.td.json
├── public/              # Static files (HTML, JS, CSS)
└── node_modules/


Additional Notes
MQTT broker must be accessible at mqtt://localhost:1883
Devices communicate over HTTP, CoAP, and MQTT protocols
