(function () {
  var hour = Number(new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hour12: false,
    timeZone: "Europe/London",
  }).format(new Date()));

  var theme = hour >= 7 && hour < 19 ? "day" : "night";
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme === "day" ? "light" : "dark";
}());
