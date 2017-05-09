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
      count = 10,
      showModal;

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
    showModal(
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
      showModal("There was an error with your selection.");
    } else if (fi.length === 0) {
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
          fType = FileUtils.getFileExtension(el.name).toLowerCase();
          fName = FileUtils.getFilenameWithoutExtension(el.name);

          //fix for hidden files in Windows
          if (!fName && el.name.slice(0, 1) === ".") {
            fName = fType;
            fType = "";
          }

          toSort.push({
            name: "<" + (fType || ".") + "> " + fName,
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
    if (items.length === 0) {
      CommandManager.register("- empty -", "anyTplNull", () => {
        showModal("Add files to your templates folder in order to make them available in the \"Template\" menu. <br>Once you add files, restart Brackets.");
      });

      Menus.getMenu("anyTplMenu").addMenuItem("anyTplNull");
    } else {
      items.forEach((fileData, i) => {
        CommandManager.register(fileData.name, "anyTpl" + i, () => {
          fileId = "anyTpl" + i;
          openModule(fileData);
        });

        Menus.getMenu("anyTplMenu").addMenuItem("anyTpl" + i);
      });
    }
  };

  menuOpenDir = () => {
    CommandManager.register("Open Templates Folder...", "anyTplOpenDir", () => {
      brackets.app.showOSFolder(templatesPath, (id) => {
        if (id) {
          showModal("Your folder no longer exists. Please update the path in your preference file and restart Brackets.");
        }
      });
    });

    Menus.getMenu("anyTplMenu").addMenuDivider();
    Menus.getMenu("anyTplMenu").addMenuItem("anyTplOpenDir");
  };

  openModule = (fileData) => {
    let currDocExt;

    showModal(
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
    ).done((id) => {
      currDocExt = FileUtils.getFileExtension(DocumentManager.getCurrentDocument().file.name).toLowerCase();

      if (id === "overwrite" && fileData.type !== currDocExt) {
        showModal("You cannot overwrite this file because it is of a different type. <br>Please choose to create an untitled document instead.").done(() => {
          openModule(fileData);
        });
      } else {
        readFile(fileData, id);
      }
    });
  };

  readFile = (fileData, id) => {
    let doc,
        ext = (fileData.type ? "." + fileData.type : "");

    if (id === "cancel") {
      return;
    }

    fileData.file.read((err, data) => {
      if (err) {
        showModal("There was an error loading your template file. Check your templates folder and restart Brackets.");

        console.error("Template Error:", err);
      } else if (id === "untitled") {
        doc = DocumentManager.createUntitledDocument(count, ext);

        doc.setText(data);
        CommandManager.execute(Commands.CMD_OPEN, doc.file);
      } else if (id === "overwrite") {
        DocumentManager.getCurrentDocument().setText(data);
      }
    });
  };

  showModal = (...rest) => {
    return Dialogs.showModalDialog(
      "anyTpl",
      "Any Template",
      ...rest
    );
  };

  AppInit.appReady(init);
});
