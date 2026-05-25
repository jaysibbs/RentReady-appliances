(function () {
  var override = "";

  try {
    override = new URLSearchParams(window.location.search).get("theme") || "";
  } catch (error) {
    override = "";
  }

  if (override !== "day" && override !== "night") {
    override = "";
  }

  var hour = Number(new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hour12: false,
    timeZone: "Europe/London",
  }).format(new Date()));

  var theme = override || (hour >= 7 && hour < 19 ? "day" : "night");
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme === "night" ? "light" : "dark";
}());
