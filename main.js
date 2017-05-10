"use strict";

/**
 * @author Leandro Silva
 * @copyright 2016 - 2017 Leandro Silva (http://grafluxe.com)
 * @license MIT
 */

/*global define, brackets */
//jshint esversion: 6, devel: true

define(function (require, exports, module) {
  "use strict";

  var AppInit = brackets.getModule("utils/AppInit"),
      CommandManager = brackets.getModule("command/CommandManager"),
      Commands = brackets.getModule("command/Commands"),
      Menus = brackets.getModule("command/Menus"),
      DocumentManager = brackets.getModule("document/DocumentManager"),
      FileSystem = brackets.getModule("filesystem/FileSystem"),
      FileUtils = brackets.getModule("file/FileUtils"),
      Dialogs = brackets.getModule("widgets/Dialogs"),
      PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
      MainViewManager = brackets.getModule("view/MainViewManager"),
      templatesPath = void 0,
      fileId = void 0,
      init = void 0,
      prefs = void 0,
      initModule = void 0,
      onInitModule = void 0,
      selectDir = void 0,
      setPath = void 0,
      setMenu = void 0,
      getContents = void 0,
      menuFiles = void 0,
      menuOpenDir = void 0,
      _openModule = void 0,
      readFile = void 0,
      count = 10,
      showModal = void 0;

  init = function init() {
    prefs = PreferencesManager.getExtensionPrefs("anyTemplate");
    templatesPath = prefs.get("templatesPath");

    MainViewManager.on("workingSetAdd", function () {
      return count++;
    });

    if (templatesPath) {
      setMenu();
      getContents();
    } else {
      initModule();
    }
  };

  initModule = function initModule() {
    showModal("Select a folder to load your templates from. <br>Note: If ever you need to edit the folders path, you can find it in your preference file.", [{
      id: "select",
      text: "Select A Folder"
    }, {
      id: "cancel",
      text: "Cancel"
    }]).done(onInitModule);
  };

  onInitModule = function onInitModule(id) {
    if (id === "select") {
      setPath();
    }
  };

  setPath = function setPath() {
    FileSystem.showOpenDialog(false, true, "Select a templates path", brackets.app.getUserDocumentsDirectory(), null, selectDir);
  };

  selectDir = function selectDir(err, fi) {
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

  setMenu = function setMenu() {
    Menus.addMenu("Template", "anyTplMenu", Menus.AFTER, Menus.AppMenuBar.NAVIGATE_MENU);
  };

  getContents = function getContents() {
    FileSystem.getDirectoryForPath(templatesPath).getContents(function (a, files) {
      var toSort = [],
          fType = void 0,
          fName = void 0;

      files.forEach(function (el) {
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

      toSort.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

      menuFiles(toSort);
      menuOpenDir();
    });
  };

  menuFiles = function menuFiles(items) {
    if (items.length === 0) {
      CommandManager.register("- empty -", "anyTplNull", function () {
        showModal("Add files to your templates folder in order to make them available in the \"Template\" menu. <br>Once you add files, restart Brackets.");
      });

      Menus.getMenu("anyTplMenu").addMenuItem("anyTplNull");
    } else {
      items.forEach(function (fileData, i) {
        CommandManager.register(fileData.name, "anyTpl" + i, function () {
          fileId = "anyTpl" + i;
          _openModule(fileData);
        });

        Menus.getMenu("anyTplMenu").addMenuItem("anyTpl" + i);
      });
    }
  };

  menuOpenDir = function menuOpenDir() {
    CommandManager.register("Open Templates Folder...", "anyTplOpenDir", function () {
      brackets.app.showOSFolder(templatesPath, function (id) {
        if (id) {
          showModal("Your folder no longer exists. Please update the path in your preference file and restart Brackets.");
        }
      });
    });

    Menus.getMenu("anyTplMenu").addMenuDivider();
    Menus.getMenu("anyTplMenu").addMenuItem("anyTplOpenDir");
  };

  _openModule = function openModule(fileData) {
    var currDoc = void 0,
        currDocExt = void 0;

    showModal("Which action would you like to take?", [{
      id: "untitled",
      text: "Create Untitled Document"
    }, {
      id: "overwrite",
      text: "Overwrite Current Document"
    }, {
      id: "cancel",
      text: "Cancel"
    }]).done(function (id) {
      currDoc = DocumentManager.getCurrentDocument();

      if (currDoc) {
        currDocExt = FileUtils.getFileExtension(currDoc.file.name).toLowerCase();
      } else {
        id = "untitled";
      }

      if (id === "overwrite" && fileData.type !== currDocExt) {
        showModal("You cannot overwrite this file because it is of a different type. <br>Please choose to create an untitled document instead.").done(function () {
          _openModule(fileData);
        });
      } else {
        readFile(fileData, id);
      }
    });
  };

  readFile = function readFile(fileData, id) {
    var doc = void 0,
        ext = fileData.type ? "." + fileData.type : "";

    if (id === "cancel") {
      return;
    }

    fileData.file.read(function (err, data) {
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

  showModal = function showModal() {
    for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
      rest[_key] = arguments[_key];
    }

    return Dialogs.showModalDialog.apply(Dialogs, ["anyTpl", "Any Template"].concat(rest));
  };

  AppInit.appReady(init);
});
