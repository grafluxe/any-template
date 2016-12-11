/**
 * @author Leandro Silva | Grafluxe, 2016
 */

/*global define, brackets */
/*jshint unused:false */

define((require, exports, module) => {
  "use strict";

  let AppInit = brackets.getModule("utils/AppInit"),
      commandManager = brackets.getModule("command/CommandManager"),
      menus = brackets.getModule("command/Menus"),
      documentManager = brackets.getModule("document/DocumentManager"),
      fileSystem = brackets.getModule("filesystem/FileSystem"),
      fileUtils = brackets.getModule("file/FileUtils"),
      dialogs = brackets.getModule("widgets/Dialogs"),
      templateDir,
      registeredFiles,
      fileId,

      getContents,
      menuFiles,
      menuOpenDir,
      openModule,
      readFile;

  AppInit.appReady(() => {
    if (getContents) {
      menus.addMenu("Template", "anyTplMenu");
      getContents();
    } else {
      dialogs.showModalDialog(
        "anyTplInstall",
        "Any Template",
        "Please restart Brackets to activate the \"Any Template\" extension."
      );
    }
  });

  getContents = () => {
    templateDir = fileSystem.getDirectoryForPath(fileUtils.getDirectoryPath(decodeURI(module.uri)) + "templates/");

    templateDir.getContents((a, files) => {
      let match,
          toSort = [];

      files.forEach((el) => {
        match = el.toString().match(/([\w\-. ']+)\.([\w\-. ']+)+\]$/);

        if (match) {
          toSort.push({
            name: "<" + match[2] + "> " + match[1],
            file: el,
            type: match[2]
          });
        }
      });

      toSort.sort((a, b) => a.name.localeCompare(b.name));

      menuFiles(toSort);
      menuOpenDir();
    });
  };

  menuFiles = (items) => {
    registeredFiles = {};

    items.forEach((el, i) => {
      registeredFiles["anyTpl" + i] = el.file;

      commandManager.register(el.name, "anyTpl" + i, () => {
        fileId = "anyTpl" + i;
        openModule();
      });

      menus.getMenu("anyTplMenu").addMenuItem("anyTpl" + i);
    });

    //empty templates dir
    if (items.length === 0) {
      commandManager.register("- empty -", "anyTplNull", () => {
        dialogs.showModalDialog(
          "anyTplEmptyMsg",
          "Any Template",
          "Add files to your templates folder in order to make them available in the \"Template\" menu. <br>Once you add files, restart Brackets."
        );
      });

      menus.getMenu("anyTplMenu").addMenuItem("anyTplNull");
    }
  };

  menuOpenDir = () => {
    commandManager.register("Templates Folder...", "anyTplDir", () => {
      brackets.app.showOSFolder(templateDir.fullPath);
    });

    menus.getMenu("anyTplMenu").addMenuDivider();
    menus.getMenu("anyTplMenu").addMenuItem("anyTplDir");
  };

  openModule = () => {
    dialogs.showModalDialog(
      "anyTplAction",
      "Any Template",
      "Which action would you like to take?",
      [
        {
          id: "untitledFile",
          text: "Create Untitled Document"
        },
        {
          id: "overwriteFile",
          text: "Overwrite Current Document"
        },
        {
          id: "cancelFile",
          text: "Cancel"
        }
      ]
    ).done(readFile);
  };

  readFile = (id) => {
    let count = documentManager.getAllOpenDocuments().length,
        doc;

    registeredFiles[fileId].read((err, data) => {
      if (id === "cancelFile") {
        return;
      }

      if (err) {
        dialogs.showModalDialog(
          "anyTplErrMsg",
          "Any Template",
          "There was an error loading your template file. Check your templates folder and restart Brackets."
        );

        console.error("Template Error:", err);
        return;
      }

      if (id === "untitledFile") {
        doc = documentManager.createUntitledDocument(count, "");

        doc.setText(data);
        documentManager.setCurrentDocument(doc);
      } else if (id === "overwriteFile") {
        documentManager.getCurrentDocument().setText(data);
      }
    });
  };

});
