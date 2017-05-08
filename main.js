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
      registeredFiles = void 0,
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
      openModule = void 0,
      readFile = void 0,
      count = 10;

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
    Dialogs.showModalDialog("anyTpl", "Any Template", "Select a folder to load your templates from. <br>Note: If ever you need to edit the folders path, you can find it in your preference file.", [{
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
      Dialogs.showModalDialog("anyTpl", "Any Template", "There was an error with your selection.");
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
          fType = FileUtils.getFileExtension(el.name) || ".";
          fName = FileUtils.getFilenameWithoutExtension(el.name);

          toSort.push({
            name: "<" + fType + "> " + fName,
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
    registeredFiles = {};

    items.forEach(function (el, i) {
      registeredFiles["anyTpl" + i] = el.file;

      CommandManager.register(el.name, "anyTpl" + i, function () {
        fileId = "anyTpl" + i;
        openModule();
      });

      Menus.getMenu("anyTplMenu").addMenuItem("anyTpl" + i);
    });

    //empty templates dir
    if (items.length === 0) {
      CommandManager.register("- empty -", "anyTplNull", function () {
        Dialogs.showModalDialog("anyTpl", "Any Template", "Add files to your templates folder in order to make them available in the \"Template\" menu. <br>Once you add files, restart Brackets.");
      });

      Menus.getMenu("anyTplMenu").addMenuItem("anyTplNull");
    }
  };

  menuOpenDir = function menuOpenDir() {
    CommandManager.register("Open Templates Folder...", "anyTplOpenDir", function () {
      brackets.app.showOSFolder(templatesPath, function (id) {
        if (id) {
          Dialogs.showModalDialog("anyTpl", "Any Template", "Your folder no longer exists. Please update the path in your preference file and restart Brackets.");
        }
      });
    });

    Menus.getMenu("anyTplMenu").addMenuDivider();
    Menus.getMenu("anyTplMenu").addMenuItem("anyTplOpenDir");
  };

  openModule = function openModule() {
    Dialogs.showModalDialog("anyTpl", "Any Template", "Which action would you like to take?", [{
      id: "untitled",
      text: "Create Untitled Document"
    }, {
      id: "overwrite",
      text: "Overwrite Current Document"
    }, {
      id: "cancel",
      text: "Cancel"
    }]).done(readFile);
  };

  readFile = function readFile(id) {
    var doc = void 0,
        fi = registeredFiles[fileId],
        ext = FileUtils.getFileExtension(fi.name);

    fi.read(function (err, data) {
      if (id === "cancel") {
        return;
      }

      if (err) {
        Dialogs.showModalDialog("anyTpl", "Any Template", "There was an error loading your template file. Check your templates folder and restart Brackets.");

        console.error("Template Error:", err);
        return;
      }

      if (id === "untitled") {
        doc = DocumentManager.createUntitledDocument(count, ext ? "." + ext : "");

        doc.setText(data);
        CommandManager.execute(Commands.CMD_OPEN, doc.file);
      } else if (id === "overwrite") {
        DocumentManager.getCurrentDocument().setText(data);
      }
    });
  };

  AppInit.appReady(init);
});
