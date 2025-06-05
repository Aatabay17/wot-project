// Загружаем список TD
fetch("/things")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("things");
    data.forEach(({ id, td }) => {
      const el = document.createElement("div");
      el.innerHTML = `
        <h2>${td.title}</h2>
        <pre>${JSON.stringify(td, null, 2)}</pre>
      `;
      container.appendChild(el);
    });
  });

