# REDCap OptGroup

This module allows a project designer to modify the choices of a dropdown field to display the labels of selected choices as option groups, where the choices are not selectable, but serve to group the selectable options into labelled groups.

When annotating a dropdown field with `@OPTGROUP='1,4,6'`, choices coded `1`, `4` and `6` are not selectable, but instead their labels are used as the group labels of the other options.

Go from this:

![Designer](img/designer.png)

To this:

![OptGroups](img/optgroup.png)

## Installation

Install the module from the REDCap module repository and enable in the Control Center, then enable on projects as needed.

## Usage

This module adds one action tag:

| Action Tag | Description |
| --- | --- |
| @OPTGROUP | Displays selected dropdown choices as option group labels, wherein the synyax `@OPTGROUP='x,y,z'` means that choices `x`, `y` and `z` are not selectable, but instead their labels are used as the group labels of the other options. |

## Limitations

This module does not work for dropdowns where autocomplete is enabled due to the different DOM structure for dropdown fields in those cases. To prevent the inadvertent selection of choices that would otherwise have been converted to option groups, the option group choices are removed from the dropdown entirely.

Perhaps a future version will implement support for autocomplete dropdowns.
