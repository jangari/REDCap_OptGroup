<?php namespace INTERSECT\OptGroup;

use Exception;

class OptGroup extends \ExternalModules\AbstractExternalModule {

    const OPTGROUP_AT = '@OPTGROUP';

    /**
     * Gets the fields annotated with the action tag, with the choices designated as headers
     * @param string $tag 
     * @param string $instrument 
     * @return array<string, string[]>
     * @throws Exception 
     */
    function getAnnotatedFields($tag, $instrument) {
        // Thanks to Andy Martin
        // See https://community.projectredcap.org/questions/32001/custom-action-tags-or-module-parameters.html
        if (!class_exists('INTERSECT\OptGroup\ActionTagHelper')) require_once('classes/ActionTagHelper.php');
        $tags = ActionTagHelper::getActionTags([$tag], null, [$instrument]);
        $annotatedFields = [];
        if (isset($tags[$tag]) && is_array($tags[$tag])) {
            // Parse the comma separated list of fields
            foreach (array_keys($tags[$tag]) as $fieldName) {
                $param = $tags[$tag][$fieldName][0];
                $quote = substr($param, 0, 1);
                $choices = array_map('trim', explode(",", trim($param, $quote)));
                if (count($choices) > 0) {
                    $annotatedFields[$fieldName] = $choices;
                }
            }
        }
        return $annotatedFields;
    }

    function redcap_survey_page($project_id, $record, $instrument) {
        $this -> render_optgroup($instrument, true);
    }

    function redcap_data_entry_form($project_id, $record, $instrument) {
        $this -> render_optgroup($instrument, false);
    }

    /**
     * Injects the OptGroup JavaScript and initializes it with the annotated fields
     * @param string $instrument 
     * @param bool $is_survey 
     * @return void 
     */
    function render_optgroup($instrument, $is_survey) {

        $annotatedFields = $this->getAnnotatedFields(self::OPTGROUP_AT, $instrument);
        if (count($annotatedFields) == 0) return;

        // Inject the JavaScript (inline for surveys)
        if (!class_exists('INTERSECT\OptGroup\InjectionHelper')) require_once('classes/InjectionHelper.php');
        $ih = InjectionHelper::init($this);
        $ih->js("js/OptGroup.js", $is_survey);

        // Inject CSS
        $ih->css("css/OptGroup.css");

        // We need the JSMO for MLM integration
        $this->initializeJavascriptModuleObject();
        $jsmo = $this->getJavascriptModuleObjectName();
        $config = [
            'fields' => $annotatedFields,
            'JSMO' => null,
            'debug' => $this->getProjectSetting('debug') == true,
            'mlmActive' => false,
            'isSurvey' => $is_survey,
        ];
        // Initialize the OptGroup
        print \RCView::script("window.INTERSECT_OptGroupEM.init(" . json_encode($config) . ", $jsmo);");
    }
}
