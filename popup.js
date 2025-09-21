document.addEventListener('DOMContentLoaded', function () {
  // Load saved settings
  chrome.storage.sync.get(['income', 'period', 'hoursPerDay', 'daysPerWeek'], function (data) {
    if (data.income) document.getElementById('income').value = data.income;
    if (data.period) document.getElementById('period').value = data.period;
    if (data.hoursPerDay) document.getElementById('hoursPerDay').value = data.hoursPerDay;
    if (data.daysPerWeek) document.getElementById('daysPerWeek').value = data.daysPerWeek;
  });

  document.getElementById('convert').addEventListener('click', function () {
    const income = parseFloat(document.getElementById('income').value);
    const period = document.getElementById('period').value;
    const hoursPerDay = parseFloat(document.getElementById('hoursPerDay').value) || 8;
    const daysPerWeek = parseFloat(document.getElementById('daysPerWeek').value) || 5;

    if (!income || income <= 0) {
      document.getElementById('status').textContent = "Please enter a valid income.";
      document.getElementById('status').style.color = "red";
      return;
    }

    // Save settings
    chrome.storage.sync.set({ income, period, hoursPerDay, daysPerWeek }, () => {
      document.getElementById('status').textContent = "Settings saved!";
      document.getElementById('status').style.color = "green";
    });

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'convertPrices',
        income,
        period,
        hoursPerDay,
        daysPerWeek
      });
    });
  });
});
