<?php namespace INTERSECT\OptGroup;

use \REDCap as REDCap;
use \Project as Project;
use ExternalModules\AbstractExternalModule;

class OptGroup extends \ExternalModules\AbstractExternalModule {

    function getTags($tags, $fields, $instruments) {
        // Thanks to Andy Martin
        // See https://community.projectredcap.org/questions/32001/custom-action-tags-or-module-parameters.html
        if (!class_exists('INTERSECT\OptGroup\ActionTagHelper')) include_once('classes/ActionTagHelper.php');
        $action_tag_results = ActionTagHelper::getActionTags($tags, $fields, $instruments);
        return $action_tag_results;
    }

    function redcap_survey_page($project_id, $record, $instrument) {
        $this -> render_optgroup($instrument);
    }

    function redcap_data_entry_form($project_id, $record, $instrument) {
        $this -> render_optgroup($instrument);
    }

    function render_optgroup($instrument) {

		// Collect project settings
		$settings = $this->getProjectSettings();
        
		// Get all annotated fields
        $tag = "@OPTGROUP";
        $annotatedFields = $this->getTags($tag, $fields=NULL, $instruments=$instrument);

        // Populate an array of annotated fields and their annotation parameters
        if (!empty($annotatedFields[$tag]) && is_array($annotatedFields[$tag])) {
            foreach (array_keys($annotatedFields[$tag]) as $fieldName) {
                $optgroupFields[$fieldName] = explode(",", trim($annotatedFields[$tag][$fieldName][0], "'\""));
            };
        };
        $this->initializeJavascriptModuleObject();

        ?>
        <script>
            document.addEventListener("DOMContentLoaded", function () {
                var optgroupMetadata = <?=json_encode($optgroupFields)?>;
                if (!optgroupMetadata) return;
                var JSMO = <?=$this->getJavascriptModuleObjectName()?>;
                var mlmActive = JSMO.isMlmActive();
                if (mlmActive) {
                    JSMO.afterRender(function() {
                        // Need to update optgroup label
                        document.querySelectorAll("[mlm-optgroup-label]").forEach(function(option) {
                            var optgroup = option.parentNode;
                            optgroup.label = option.textContent.trim();
                        });
                    });
                }
                Object.keys(optgroupMetadata).forEach(function(fieldName) {
                    var select = document.querySelector("select[name='" + fieldName + "']");
                    if (!select) return; // Skip if no matching select found

                    var groupValues = optgroupMetadata[fieldName];
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
            });
        </script>
        <?php
    }
}
