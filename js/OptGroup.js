// OptGroup EM
// @ts-check
;(function() {

// @ts-ignore
var OptGroupEM = window.INTERSECT_OptGroupEM ?? {
    init: initialize
};
// @ts-ignore
window.INTERSECT_OptGroupEM = OptGroupEM;

var config = {
    fields: {},
    JSMO: null,
    mlmActive: false,
    isSurvey: false,
    debug: false
};

/**
 * Initializes OptGroup
 * @param {Object} data 
 * @param {Object} jsmo 
 */
function initialize(data, jsmo) {
    // Store config
    config = data;
    config.JSMO = jsmo;
    if (config.debug) {
        console.log('OptGroupEM initialized', config);
    }
    // Listen for DOMContentLoaded
    document.addEventListener("DOMContentLoaded", render);
}

/**
 * Orchestrates rendering
 */
function render() {
    config.mlmActive = config.JSMO.isMlmActive();
    if (config.mlmActive) {
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
        if (select) {
            render_dropdown(select, fieldName);
            return;
        }
        var checkboxTestInput = document.querySelector("input[type='checkbox'][name='__chkn__" + fieldName + "']");
        if (checkboxTestInput) {
            render_checkbox(fieldName); // Call the new function for checkboxes
            return;
        }
        // TODO: Special attention needed for enhanced radios (surveys)
        var radioLabel = document.querySelector("label[data-mlm-field='" + fieldName + "'][data-mlm-type='enum']");
        if (radioLabel) {
            render_radio(fieldName);
            return;
        }
    });
}

/**
 * Renders dropdown headers (<optgroup>)
 * @param {HTMLElement} select 
 * @param {string} fieldName 
 */
function render_dropdown(select, fieldName) {
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
            currentOptGroup.classList.add("optgroup-header");
            currentOptGroup.classList.add("optgroup-dropdown");
            currentOptGroup.label = option.textContent.trim();
            if (config.mlmActive) {
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
}

/**
 * Renders (enhanced) radio headers
 * @param {string} fieldName 
 */
function render_radio(fieldName) {
    const options = config.fields[fieldName];
    for (const option of options) {
        const radioInput = $("input#opt-" + fieldName + "_" + option);
        radioInput.prop("disabled", true).hide();
        const radioLabel = $("label[data-mlm-field='" + fieldName + "'][data-mlm-type='enum'][data-mlm-value='" + option + "']").addClass('optgroup-header').addClass('optgroup-radio');
        radioLabel.parent().css({
            'pointer-events': 'none',
            'cursor': 'default',
            'margin-left': '0',
            'text-indent': '0'
        });
        if (config.isSurvey) {
            // There might be enhanced radios in surveys
            const enhLabel = $("label[for='opt-" + fieldName + "_" + option + "']");
            enhLabel.css({
                'pointer-events': 'none',
                'cursor': 'default'
            }).removeClass('hover').addClass('optgroup-header').addClass('optgroup-enhradio');
        }
    }
}

/**
 * Renders checkbox headers
 * @param {string} fieldName 
 */
function render_checkbox(fieldName) {
    const headerValues = config.fields[fieldName];

    headerValues.forEach(function(headerValue) {
        const checkboxInput = document.querySelector("input[type='checkbox'][name='__chkn__" + fieldName + "'][code='" + headerValue + "']");

        if (checkboxInput) {
            const span = document.createElement('span');

            span.setAttribute("type", "checkbox");
            if (checkboxInput.hasAttribute("aria-labelledby")) {
                span.setAttribute("aria-labelledby", checkboxInput.getAttribute("aria-labelledby"));
            }
            span.setAttribute("tabindex", checkboxInput.getAttribute("tabindex") || "0");
            span.id = checkboxInput.id;
            span.setAttribute("name", checkboxInput.getAttribute("name"));
            span.setAttribute("code", checkboxInput.getAttribute("code"));

            if (checkboxInput.hasAttribute("onclick")) {
                span.setAttribute("onclick", checkboxInput.getAttribute("onclick"));
            }

            checkboxInput.parentNode.replaceChild(span, checkboxInput);

            const parentDiv = span.closest('div.choicevert');
            if (parentDiv) {
                parentDiv.style.pointerEvents = 'none';
                parentDiv.style.cursor = 'default';
                parentDiv.style.marginLeft = '0px';
                parentDiv.style.textIndent = '0px';
            }

            const label = document.querySelector("label[for='" + span.id + "']");
            if (label) {
                label.classList.add('optgroup-header');
                label.classList.add('optgroup-checkbox');
            }

            if (config.debug) {
                console.log("OptGroupEM: Converted checkbox '" + headerValue + "' in field '" + fieldName + "' to span header.");
            }

        } else {
            if (config.debug) {
                console.warn("OptGroupEM: Checkbox input for header value '" + headerValue + "' in field '" + fieldName + "' not found.");
            }
        }
    });
}
})();
