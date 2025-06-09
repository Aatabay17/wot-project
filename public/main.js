async function loadThings() {
  const res = await fetch("/things");
  const data = await res.json();

  // UI elements
  const tempValueEl = document.getElementById("temperature-value");
  const tempUpdatedEl = 
document.getElementById("temperature-last-updated");
  const resetBtn = document.getElementById("reset-temp");

  const lightStatusEl = document.getElementById("light-status");
  const lightUpdatedEl = document.getElementById("light-last-updated");
  const toggleBtn = document.getElementById("toggle-light");

  const tdTempPre = document.getElementById("td-temp");
  const tdLightPre = document.getElementById("td-light");

  // Get TDs
  const tempThing = data.find(d => d.id === "temperature-sensor");
  const lightThing = data.find(d => d.id === "smart-light");

  let lastLightStatus = null;

  // Update temperature
  async function updateTemperature() {
    try {
      const res = await 
fetch(tempThing.td.properties.temperature.forms[0].href);
      const temp = await res.json();
      tempValueEl.textContent = temp;
      tempUpdatedEl.textContent = new Date().toLocaleTimeString();
    } catch (e) {
      tempValueEl.textContent = "Error";
    }
  }

  // Update light only if changed
  async function updateLightStatus() {
    try {
      const res = await 
fetch(lightThing.td.properties.status.forms[0].href);
      const status = await res.json();

      if (status !== lastLightStatus) {
        lightStatusEl.textContent = status;
        lightStatusEl.style.color = (status === "on") ? "green" :
                                    (status === "off") ? "gray" : "black";
        lightUpdatedEl.textContent = new Date().toLocaleTimeString();
        lastLightStatus = status;
      }
    } catch (e) {
      lightStatusEl.textContent = "Error";
      lightStatusEl.style.color = "red";
    }
  }

  // Reset temperature
  resetBtn.onclick = async () => {
    try {
      await fetch(tempThing.td.actions.reset.forms[0].href, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      alert("Temperature sensor reset!");
      await updateTemperature();
    } catch {
      alert("Failed to reset temperature sensor.");
    }
  };

  // Toggle light
  toggleBtn.onclick = async () => {
    try {
      await fetch(lightThing.td.actions.toggle.forms[0].href, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      setTimeout(updateLightStatus, 1000);
    } catch {
      alert("Failed to toggle light.");
    }
  };

  // JSON TDs
  tdTempPre.textContent = JSON.stringify(tempThing.td, null, 2);
  tdLightPre.textContent = JSON.stringify(lightThing.td, null, 2);

  // Initial update
  await updateTemperature();
  await updateLightStatus();

  // Periodic updates
  setInterval(updateTemperature, 5000);
  setInterval(updateLightStatus, 5000);
}

loadThings();

