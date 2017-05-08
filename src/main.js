/**
 * @author Leandro Silva
 * @copyright 2016 - 2017 Leandro Silva (http://grafluxe.com)
 * @license MIT
 */

/*global define, brackets */
//jshint esversion: 6, devel: true

define((require, exports, module) => {
  "use strict";

  let AppInit = brackets.getModule("utils/AppInit"),
      CommandManager = brackets.getModule("command/CommandManager"),
      Commands = brackets.getModule("command/Commands"),
      Menus = brackets.getModule("command/Menus"),
      DocumentManager = brackets.getModule("document/DocumentManager"),
      FileSystem = brackets.getModule("filesystem/FileSystem"),
      FileUtils = brackets.getModule("file/FileUtils"),
      Dialogs = brackets.getModule("widgets/Dialogs"),
      PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
      MainViewManager = brackets.getModule("view/MainViewManager"),
      templatesPath,
      registeredFiles,
      fileId,
      init,
      prefs,
      initModule,
      onInitModule,
      selectDir,
      setPath,
      setMenu,
      getContents,
      menuFiles,
      menuOpenDir,
      openModule,
      readFile,
      count = 10;

  init = () => {
    prefs = PreferencesManager.getExtensionPrefs("anyTemplate");
    templatesPath = prefs.get("templatesPath");

    MainViewManager.on("workingSetAdd", () => count++);

    if (templatesPath) {
      setMenu();
      getContents();
    } else {
      initModule();
    }
  };

  initModule = () => {
    Dialogs.showModalDialog(
        "anyTpl",
        "Any Template",
        "Select a folder to load your templates from. <br>Note: If ever you need to edit the folders path, you can find it in your preference file.",
        [
          {
            id: "select",
            text: "Select A Folder"
          },
          {
            id: "cancel",
            text: "Cancel"
          }
        ]
      ).done(onInitModule);
  };

  onInitModule = (id) => {
    if (id === "select") {
      setPath();
    }
  };

  setPath = () => {
    FileSystem.showOpenDialog(
      false,
      true,
      "Select a templates path",
      brackets.app.getUserDocumentsDirectory(),
      null,
      selectDir
    );
  };

  selectDir = (err, fi) => {
    if (err) {
      console.error(err);
      Dialogs.showModalDialog(
        "anyTpl",
        "Any Template",
        "There was an error with your selection."
      );
      return;
    }

    if (fi.length === 0) {
      initModule();
    } else {
      templatesPath = fi[0];
      prefs.set("templatesPath", templatesPath);

      setMenu();
      getContents();
    }
  };

  setMenu = () => {
    Menus.addMenu("Template", "anyTplMenu", Menus.AFTER, Menus.AppMenuBar.NAVIGATE_MENU);
  };

  getContents = () => {
    FileSystem.getDirectoryForPath(templatesPath).getContents((a, files) => {
      let toSort = [],
          fType,
          fName;

      files.forEach((el) => {
        if (el.isFile) {
          fType = FileUtils.getFileExtension(el.name) || ".";
          fName = FileUtils.getFilenameWithoutExtension(el.name);

          toSort.push({
            name: "<" + fType + "> " + fName,
            file: el,
            type: fType
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

      CommandManager.register(el.name, "anyTpl" + i, () => {
        fileId = "anyTpl" + i;
        openModule();
      });

      Menus.getMenu("anyTplMenu").addMenuItem("anyTpl" + i);
    });

    //empty templates dir
    if (items.length === 0) {
      CommandManager.register("- empty -", "anyTplNull", () => {
        Dialogs.showModalDialog(
          "anyTpl",
          "Any Template",
          "Add files to your templates folder in order to make them available in the \"Template\" menu. <br>Once you add files, restart Brackets."
        );
      });

      Menus.getMenu("anyTplMenu").addMenuItem("anyTplNull");
    }
  };

  menuOpenDir = () => {
    CommandManager.register("Open Templates Folder...", "anyTplOpenDir", () => {
      brackets.app.showOSFolder(templatesPath, (id) => {
        if (id) {
          Dialogs.showModalDialog(
            "anyTpl",
            "Any Template",
            "Your folder no longer exists. Please update the path in your preference file and restart Brackets."
          );
        }
      });
    });

    Menus.getMenu("anyTplMenu").addMenuDivider();
    Menus.getMenu("anyTplMenu").addMenuItem("anyTplOpenDir");
  };

  openModule = () => {
    Dialogs.showModalDialog(
      "anyTpl",
      "Any Template",
      "Which action would you like to take?",
      [
        {
          id: "untitled",
          text: "Create Untitled Document"
        },
        {
          id: "overwrite",
          text: "Overwrite Current Document"
        },
        {
          id: "cancel",
          text: "Cancel"
        }
      ]
    ).done(readFile);
  };

  readFile = (id) => {
    let doc,
        fi = registeredFiles[fileId],
        ext = FileUtils.getFileExtension(fi.name);

    fi.read((err, data) => {
      if (id === "cancel") {
        return;
      }

      if (err) {
        Dialogs.showModalDialog(
          "anyTpl",
          "Any Template",
          "There was an error loading your template file. Check your templates folder and restart Brackets."
        );

        console.error("Template Error:", err);
        return;
      }

      if (id === "untitled") {
        doc = DocumentManager.createUntitledDocument(count, (ext ? "." + ext : ""));

        doc.setText(data);
        CommandManager.execute(Commands.CMD_OPEN, doc.file);
      } else if (id === "overwrite") {
        DocumentManager.getCurrentDocument().setText(data);
      }
    });
  };

  AppInit.appReady(init);
});
