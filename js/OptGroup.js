// OptGroup EM
// @ts-check
;(function() {

// @ts-ignore
var OptGroupEM = window.INTERSECT_OptGroupEM ?? {
    init: initialize
};
// @ts-ignore
window.INTERSECT_OptGroupEM = OptGroupEM;

var config = {};

function initialize(fields, jsmo) {
    // Store config
    config.fields = fields;
    config.JSMO = jsmo;
    // Listen for DOMContentLoaded
    document.addEventListener("DOMContentLoaded", render);
}

function render() {
    var mlmActive = config.JSMO.isMlmActive();
    if (mlmActive) {
        config.JSMO.afterRender(function() {
            // Need to update optgroup label
            document.querySelectorAll("[mlm-optgroup-label]").forEach(function(option) {
                var optgroup = option.parentNode;
                optgroup.label = option.textContent.trim();
            });
        });
    }
    Object.keys(config.fields).forEach(function(fieldName) {
        var select = document.querySelector("select[name='" + fieldName + "']");
        if (!select) return; // Skip if no matching select found

        var groupValues = config.fields[fieldName];
        var options = Array.from(select.options);
        var fragment = document.createDocumentFragment();
        var currentOptGroup = null;
        var foundValues = new Set(options.map(option => option.value));
        var selectedValue = select.value;

        groupValues.forEach(function(groupValue) {
            if (!foundValues.has(groupValue)) {
                console.warn("Optgroup value '" + groupValue + "' for field '" + fieldName + "' is missing from dropdown choices.");
            }
        });
        if (select.classList.contains('rc-autocomplete')) {
            // When autocomplete is enabled, the action tag will break down. To preserve the intent, we simply remove all options marked as group labels
            options.forEach(function(option) {
                if (groupValues.includes(option.value)) {
                    $(option).remove();
                }
            });
            return; // Done
        }
        options.forEach(function(option) {
            if (groupValues.includes(option.value)) {
                currentOptGroup = document.createElement("optgroup");
                currentOptGroup.setAttribute("choice", option.value);
                currentOptGroup.label = option.textContent.trim();
                if (mlmActive) {
                    // Hide the original option but add it so that MLM can translate it, and add a marker
                    option.style.display = "none";
                    option.setAttribute("mlm-optgroup-label", "1");
                    option.setAttribute("disabled", "disabled");
                    currentOptGroup.appendChild(option);
                }
                fragment.appendChild(currentOptGroup);
                return;
            }
            (currentOptGroup || fragment).appendChild(option);
        });

        select.innerHTML = "";
        select.appendChild(fragment);
        // Restore selected value
        select.value = selectedValue;
    });
}



})();