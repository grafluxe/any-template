# Any Template

This Adobe Brackets extension allows you to easily create and use *your own* template files. It adds a new "Template" menu item to the main menu bar which lists any template files you create. Templates can be of any file type supported by Brackets.

![Screenshot](./screenshot.gif)

## Add/Edit Templates

- From the "Template" menu item, select "Open Templates Folder..."
- Add any file type supported by Brackets.
- Restart Brackets to see updated files.

### Download Templates

Optionally, you can find some templates [here](https://github.com/Grafluxe/templates).

## Select Template

- From the "Template" menu item, select your desired template file.
  - Template files are sorted by type.
- Once a file is selected, you will be presented with the following options:
  - Create Untitled Document
  - Overwrite Current Document
  - Cancel

## Edit Template Path

- Upon first installing this extension, you will be asked to select a folder to load your templates from.
- If ever you need to edit the folders path, you can find it in your preference file.

## Install Extension

In the Brackets Extension Manager, either:

- Search for Any Template
- Use the "install from URL" option and paste in `https://github.com/Grafluxe/any-template`

Restart Brackets after install.

## Changelog

### 2.4.2

- Fix issue where an error occurs when attempting to use a template when no working files are open.

### 2.4.1

- Update "Overwrite Current Document" logic to only support files of the same type.
- Fix issue with how files with no extension are handled when adding the extension to newly created untitled files (see v2.4.0).
- Make code more DRY.

### 2.4.0

- Add file extensions to newly created untitled files (so that code hinting and formatting works).
  - Brackets 1.9 now supports [language mode changing](https://github.com/adobe/brackets/pull/13086) on untitled files.
- Babelify logic to ES5 (in order to support certain Linux distributions).

### 2.3.0

- Support files with no extension.

### 2.2.0

- Handle cases where the templates folder no longer exists.

### 2.1.0

- Update counter logic for when creating untitled documents.
  - Counter now updates on the "workingSetAdd" event.
  - Starting file counter at 10 so to better avoid Brackets "duplicated in mru list" issue.

### 2.0.0

- Rewrite logic to allow users to choose their own template path.
- Clean up code.

### 1.1.0

- Replace deprecated Brackets method with new one.
- Hard set menu item location.

### 1.0.1

- Fix issue where Brackets throws an error if an untitled file has an extension.
  - Due to this [limitation](https://trello.com/c/CNXuU4TY/1369-switch-language-type-of-untitled-documents), I no longer set a file type, so code hinting will not work until the file is saved.
- Rename module titles.

### 1.0.0

- Initial release.

## License

Copyright (c) 2016 - 2017 Leandro Silva (http://grafluxe.com)

Released under the MIT License.

See LICENSE.md for entire terms.
