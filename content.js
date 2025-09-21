
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'convertPrices') {
    convertPricesOnPage(message.income, message.period, message.hoursPerDay, message.daysPerWeek);
  }
});

function convertPricesOnPage(income, period, hoursPerDay, daysPerWeek) {
  let hourlyRate;

  switch (period) {
    case "month":
      hourlyRate = income / (4 * daysPerWeek * hoursPerDay);
      break;
    case "week":
      hourlyRate = income / (daysPerWeek * hoursPerDay);
      break;
    case "day":
      hourlyRate = income / hoursPerDay;
      break;
    case "hour":
      hourlyRate = income;
      break;
    default:
      hourlyRate = 0;
  }

  if (hourlyRate <= 0) return;


  const priceRegex = /([$€£₹]\s?\d+(?:[.,]\d{2})?)/g;

  walk(document.body, function (textNode) {
    let oldText = textNode.nodeValue;
    if (priceRegex.test(oldText)) {
      let newText = oldText.replace(priceRegex, function (match) {
        let num = parseFloat(match.replace(/[^0-9.]/g, ""));
        if (isNaN(num)) return match;
        let hoursNeeded = num / hourlyRate;
        return `${match} (~${hoursNeeded.toFixed(1)}h)`;
      });
      textNode.nodeValue = newText;
    }
  });
}


function walk(node, callback) {
  let child, next;
  switch (node.nodeType) {
    case 1:
    case 9:
    case 11: 
      child = node.firstChild;
      while (child) {
        next = child.nextSibling;
        walk(child, callback);
        child = next;
      }
      break;
    case 3:
      callback(node);
      break;
  }
}
