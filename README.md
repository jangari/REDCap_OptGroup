# REDCap OptGroup

This module allows a project designer to modify the dropdown box of a field to display the labels of the selected choices as option groups, where the choices are not selectable.

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
