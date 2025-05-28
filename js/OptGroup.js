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

        let fieldUIContainer = null;
        // Try common ID patterns for field containers
        let elById = document.getElementById(fieldName + '-tr'); // For data entry forms
        if (elById) {
            fieldUIContainer = elById;
        } else {
            elById = document.querySelector('[sq_id="' + fieldName + '"]'); // For survey pages
            if (elById) {
                fieldUIContainer = elById;
            } else {
                // Fallback: find based on an input element for the field
                let anyInputForField = document.querySelector(
                    "input[name='" + fieldName + "'], " +                            // Text, notes, etc.
                    "input[name^='" + fieldName + "---'], " +                       // Radios (non-enhanced name pattern)
                    "input[name='" + fieldName + "___radio'], " +                   // Radios (enhanced name pattern)
                    "input[name='__chkn__" + fieldName + "']"                       // Checkboxes
                );
                if (anyInputForField) {
                    // Traverse up to a common significant parent like <tr>, .ds-question-spacing (survey), or .questionvalidation (data entry)
                    fieldUIContainer = anyInputForField.closest('tr, div.ds-question-spacing, div.questionvalidation, td.data, div[data-kind="field-value"]');
                }
            }
        }

        if (!fieldUIContainer && config.debug) {
            console.warn('OptGroupEM: Could not robustly find UI container for field:', fieldName, '- enhanced choice detection might be less reliable.');
        }

        var enhancedWrapper = fieldUIContainer ? fieldUIContainer.querySelector(".enhancedchoice_wrapper") : null;

        if (!enhancedWrapper) {
             let fieldValueContainer = document.querySelector(
                `td.data span[data-kind="field-value"] input[name="${fieldName}"], ` +
                `td.data span[data-kind="field-value"] input[name="${fieldName}___radio"], ` +
                `div[data-kind="field-value"] input[name="__chkn__${fieldName}"]`
            );
            if(fieldValueContainer){
                fieldValueContainer = fieldValueContainer.closest('span[data-kind="field-value"], div[data-kind="field-value"]');
                if(fieldValueContainer) {
                    enhancedWrapper = fieldValueContainer.querySelector(".enhancedchoice_wrapper");
                }
            }
        }


        if (enhancedWrapper) {
            render_enhanced_groups(fieldName, enhancedWrapper);
            return; // Enhanced rendering handled
        }
        var checkboxTestInput = document.querySelector("input[type='checkbox'][name='__chkn__" + fieldName + "']");
        if (checkboxTestInput) {
            render_checkbox(fieldName);
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

/**
 * Restructures enhanced radio/checkbox choices for optgroup display.
 * Creates captions for optgroups and groups choices under them.
 * @param {string} fieldName The name of the field.
 * @param {HTMLElement} originalWrapper The .enhancedchoice_wrapper element.
 */
function render_enhanced_groups(fieldName, originalWrapper) {
    const groupHeaderValues = config.fields[fieldName] || []; // Values designated as optgroup headers
    const allEnhancedChoiceDivs = Array.from(originalWrapper.querySelectorAll('div.enhancedchoice'));

    const newMasterContainer = document.createElement('div');
    newMasterContainer.className = 'optgroup-enhanced-master-container';
    let currentChoiceGroupContainer = null; // The div that holds choices under a caption

    // Collect data about each enhanced choice
    const choices = allEnhancedChoiceDivs.map(choiceDiv => {
        const label = choiceDiv.querySelector('label');
        // The choice text and value are within a span.ec inside the label
        const spanEc = label ? label.querySelector('span.ec[data-mlm-value]') : null;
        if (label && spanEc) {
            return {
                value: spanEc.getAttribute('data-mlm-value'),
                text: spanEc.textContent.trim(),
                element: choiceDiv,      // The actual <div class="enhancedchoice">
                labelElement: label      // The <label> inside it, which is the clickable button
            };
        }
        return null;
    }).filter(c => c !== null); // Remove any nulls if elements weren't found

    choices.forEach(choice => {
        const isHeader = groupHeaderValues.includes(choice.value);

        if (isHeader) {
            // This choice is an optgroup header.
            // 1. Create the caption div for this group.
            const captionDiv = document.createElement('div');
            captionDiv.className = 'optgroup-enhanced-caption optgroup-header'; // Apply header styling
            captionDiv.textContent = choice.text; // Use the choice's text as the caption
            newMasterContainer.appendChild(captionDiv);

            // 2. Create the container for the actual choice buttons that will fall under this caption.
            currentChoiceGroupContainer = document.createElement('div');
            currentChoiceGroupContainer.className = 'optgroup-enhanced-group';
            newMasterContainer.appendChild(currentChoiceGroupContainer);

            // 3. Neutralize the original enhanced choice button for this header.
            //    The caption now represents it. We hide the original button.
            if (choice.labelElement) {
                choice.labelElement.classList.add('optgroup-header'); // Add class for consistent styling if ever shown
                // Add specific class for radio/checkbox enhanced headers
                if (choice.labelElement.htmlFor && choice.labelElement.htmlFor.startsWith('opt-')) { // Radio enhanced choice
                    choice.labelElement.classList.add('optgroup-enhradio');
                } else { // Checkbox enhanced choice (id starts with id-__chk__)
                    choice.labelElement.classList.add('optgroup-enhcheckbox');
                }
                choice.labelElement.style.pointerEvents = 'none';
                choice.labelElement.style.cursor = 'default';
                choice.labelElement.classList.remove('hover', 'selectedchkbox', 'unselectedchkbox'); // Remove REDCap's interactive classes

                // Remove event handlers to ensure it's not interactive
                choice.labelElement.removeAttribute('onclick');
                choice.labelElement.removeAttribute('onkeydown');
                choice.labelElement.tabIndex = -1; // Make non-focusable
            }
            // Hide the entire original <div class="enhancedchoice"> for the header.
            choice.element.style.display = 'none';

        } else if (currentChoiceGroupContainer) {
            // This choice is a regular item. Move its <div class="enhancedchoice">
            // into the current active group container.
            currentChoiceGroupContainer.appendChild(choice.element);
        } else {
            // This choice appears before any defined optgroup header.
            // Append it directly to the master container or handle as an "default/ungrouped" section.
            // For now, log it. You might want a default group container for these.
            if (config.debug) {
                console.warn('OptGroupEM: Enhanced choice "' + choice.text + '" for field "' + fieldName + '" appears before any optgroup header.');
            }
            // To display it: newMasterContainer.appendChild(choice.element);
            // However, this might not be desired if all items should be under a caption.
        }
    });

    // Replace the content of the original .enhancedchoice_wrapper with the new structured layout.
    originalWrapper.innerHTML = '';
    originalWrapper.appendChild(newMasterContainer);

    if (config.debug) {
        console.log('OptGroupEM: Enhanced groups restructured for field', fieldName);
    }
}
})();
