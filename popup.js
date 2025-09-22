document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const allInputs = [...document.querySelectorAll('input[type="number"], input[type="checkbox"]')];
    const displayButtons = {
        replace: document.getElementById('replaceBtn'),
        both: document.getElementById('bothBtn'),
    };
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const elements = {
        toggle: document.getElementById('toggleMode'),
        hourlyRate: document.getElementById('hourlyRate'),
        dailyHours: document.getElementById('dailyHours'),
        dailyRate: document.getElementById('dailyRate'),
        monthlyHours: document.getElementById('monthlyHours'),
        monthlyDays: document.getElementById('monthlyDays'),
        monthlySalary: document.getElementById('monthlySalary'),
        monthlyExpenses: document.getElementById('monthlyExpenses'),
        dailyHourlyCalc: document.getElementById('dailyHourlyCalc'),
        monthlyHourlyCalc: document.getElementById('monthlyHourlyCalc'),
        disposableIncome: document.getElementById('disposableIncome'),
    };

    // --- State & Calculations ---
    const state = {
        activeTab: 'hourly',
        displayMode: 'replace',
    };

    function calculate() {
        let effectiveHourlyRate = 0;
        const dailyRate = parseFloat(elements.dailyRate.value) || 0;
        const dailyHours = parseFloat(elements.dailyHours.value) || 1;
        const dailyHourly = dailyHours > 0 ? dailyRate / dailyHours : 0;
        elements.dailyHourlyCalc.textContent = dailyHourly.toFixed(2);
        const monthlySalary = parseFloat(elements.monthlySalary.value) || 0;
        const monthlyExpenses = parseFloat(elements.monthlyExpenses.value) || 0;
        const monthlyDays = parseFloat(elements.monthlyDays.value) || 1;
        const monthlyHours = parseFloat(elements.monthlyHours.value) || 1;
        const disposable = monthlySalary - monthlyExpenses;
        const totalHours = monthlyDays * monthlyHours;
        const monthlyHourly = totalHours > 0 ? disposable / totalHours : 0;
        elements.disposableIncome.textContent = disposable.toFixed(2);
        elements.monthlyHourlyCalc.textContent = monthlyHourly.toFixed(2);
        switch (state.activeTab) {
            case 'daily':  effectiveHourlyRate = dailyHourly; break;
            case 'monthly': effectiveHourlyRate = monthlyHourly; break;
            default: effectiveHourlyRate = parseFloat(elements.hourlyRate.value) || 0;
        }
        return effectiveHourlyRate;
    }

    // --- Settings Management ---
    function saveSettings() {
        const settings = {
            convertEnabled: elements.toggle.checked,
            displayMode: state.displayMode,
            activeTab: state.activeTab,
        };
        for (const el of Object.values(elements)) {
            if (el.tagName === 'INPUT' && el.type === 'number') {
                settings[el.id] = parseFloat(el.value) || 0;
            }
        }
        settings.effectiveHourlyRate = calculate();
        chrome.storage.sync.set(settings, () => {
            console.log('Settings saved');
            triggerConversion();
        });
    }

    function loadSettings() {
        const keys = [
            'convertEnabled', 'displayMode', 'activeTab', 'effectiveHourlyRate',
            'hourlyRate', 'dailyHours', 'dailyRate', 'monthlyHours', 'monthlyDays', 'monthlySalary', 'monthlyExpenses'
        ];
        chrome.storage.sync.get(keys, (data) => {
            elements.toggle.checked = data.convertEnabled || false;
            state.displayMode = data.displayMode || 'replace';
            Object.values(displayButtons).forEach(btn => btn.classList.remove('active'));
            if (displayButtons[state.displayMode]) {
                displayButtons[state.displayMode].classList.add('active');
            }
            state.activeTab = data.activeTab || 'hourly';
            updateActiveTab();
            for (const key of keys) {
                if (elements[key] && elements[key].tagName === 'INPUT') {
                    elements[key].value = data[key] || elements[key].value;
                }
            }
            calculate();
        });
    }

    // --- UI Updates ---
    function updateActiveTab() {
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id.startsWith(state.activeTab));
        });
    }

    // --- Event Listeners ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            state.activeTab = button.dataset.tab;
            updateActiveTab();
            saveSettings();
        });
    });
    Object.entries(displayButtons).forEach(([mode, button]) => {
        button.addEventListener('click', () => {
            state.displayMode = mode;
            Object.values(displayButtons).forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            saveSettings();
        });
    });
    allInputs.forEach(input => {
        input.addEventListener('input', saveSettings);
    });

    // --- Main Action ---
    function triggerConversion() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: runConversionScript,
                });
            }
        });
    }
    
    // Initial Load
    loadSettings();
});



function runConversionScript() {
    const CONVERTED_SPAN_CLASS = 'price-to-time-converted-span';

    if (window.priceConversionObserver) {
        window.priceConversionObserver.disconnect();
    }

    document.querySelectorAll(`span.${CONVERTED_SPAN_CLASS}`).forEach(span => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = span.dataset.originalContent;
        span.replaceWith(...tempDiv.childNodes);
    });

    chrome.storage.sync.get(['convertEnabled', 'effectiveHourlyRate', 'displayMode'], (data) => {
        if (!data.convertEnabled || !data.effectiveHourlyRate || data.effectiveHourlyRate <= 0) {
            return;
        }

        const rate = data.effectiveHourlyRate;
        const displayMode = data.displayMode || 'replace';
        const currencyRegex = /(?:(\$|৳|BDT)\s?(\d+(?:,\d{3})*(?:\.\d{1,2})?))|(?:(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s?(BDT|৳))/gi;
        const numberOnlyRegex = /^\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*$/;

        function getFormattedTime(priceNumber, originalMatch) {
            let hours = priceNumber / rate;
            let formattedTime;
            if (hours < 1 / 60) formattedTime = '<1m';
            else if (hours < 1) formattedTime = `${Math.round(hours * 60)}m`;
            else if (hours < 24) {
                const h = Math.floor(hours);
                const m = Math.round((hours - h) * 60);
                formattedTime = m === 0 ? `${h}h` : `${h}h ${m}m`;
            } else {
                const d = Math.floor(hours / 24);
                const rh = Math.round(hours % 24);
                formattedTime = rh === 0 ? `${d}d` : `${d}d ${rh}h`;
            }
            return displayMode === 'both' ? `${originalMatch} (${formattedTime})` : formattedTime;
        }

        function convertTextNode(node) {
            if (!node.parentElement || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.parentElement.tagName)) {
                return;
            }
            const text = node.textContent;
            if (!new RegExp(currencyRegex).test(text)) {
                return;
            }
            const frag = document.createDocumentFragment();
            let lastIndex = 0;
            text.replace(currencyRegex, (match, codeBefore, numBefore, numAfter, codeAfter, offset) => {
                const num = numBefore || numAfter;
                
                if (offset > lastIndex) {
                    frag.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
                }
                const priceNumber = parseFloat(num.replace(/,/g, '')) || 0;
                const replacementText = getFormattedTime(priceNumber, match);

                const span = document.createElement('span');
                span.className = CONVERTED_SPAN_CLASS;
                span.dataset.originalContent = match;
                span.textContent = replacementText;
                frag.appendChild(span);
                lastIndex = offset + match.length;
            });
            if (lastIndex < text.length) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex)));
            }
            node.replaceWith(frag);
        }

        function traverse(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                convertTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.matches('span[class*="price"], bdi, div[class*="price"]') && !node.querySelector(`.${CONVERTED_SPAN_CLASS}`)) {
                    const match = node.textContent.match(numberOnlyRegex);
                    if (match) {
                        const originalHTML = node.innerHTML;
                        const priceNumber = parseFloat(match[1].replace(/,/g, '')) || 0;
                        const replacementText = getFormattedTime(priceNumber, node.textContent);
                        
                        const span = document.createElement('span');
                        span.className = CONVERTED_SPAN_CLASS;
                        span.dataset.originalContent = originalHTML;
                        span.innerHTML = replacementText;

                        node.innerHTML = '';
                        node.appendChild(span);
                        return;
                    }
                }

                for (const child of Array.from(node.childNodes)) {
                    traverse(child);
                }
            }
        }

        traverse(document.body);

        const observer = new MutationObserver(mutations => {
            observer.disconnect();
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(addedNode => {
                    if (addedNode.nodeType === Node.ELEMENT_NODE && addedNode.closest(`.${CONVERTED_SPAN_CLASS}`)) {
                        return;
                    }
                    traverse(addedNode);
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        window.priceConversionObserver = observer;
    });
}