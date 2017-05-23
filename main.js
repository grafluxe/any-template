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
      init = void 0,
      prefs = void 0,
      initModule = void 0,
      selectDir = void 0,
      setPath = void 0,
      setMenu = void 0,
      getTemplates = void 0,
      menuList = void 0,
      menuOpenDir = void 0,
      selectActionModal = void 0,
      onOverwrite = void 0,
      onUntitled = void 0,
      onReadErr = void 0,
      count = 10,
      showModal = void 0,
      selectedItem = void 0;

  init = function init() {
    prefs = PreferencesManager.getExtensionPrefs("anyTemplate");
    templatesPath = prefs.get("templatesPath");

    MainViewManager.on("workingSetAdd", function () {
      return count++;
    });

    if (templatesPath) {
      setMenu();
      getTemplates();
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
    }]).done(function (id) {
      if (id === "select") {
        setPath();
      }
    });
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
      getTemplates();
    }
  };

  setMenu = function setMenu() {
    Menus.addMenu("Template", "anyTplMenu", Menus.AFTER, Menus.AppMenuBar.NAVIGATE_MENU);
  };

  getTemplates = function getTemplates() {
    FileSystem.getDirectoryForPath(templatesPath).getContents(function (a, files) {
      var toSort = [],
          fName = void 0,
          fType = void 0;

      files.forEach(function (el) {
        if (el.isFile) {
          fName = FileUtils.getFilenameWithoutExtension(el.name);
          fType = FileUtils.getFileExtension(el.name).toLowerCase();

          if (!fName) {
            fName = fType;
            fType = ".";
          }

          toSort.push({
            menuName: "<" + (fType || " ") + "> " + fName,
            file: el,
            type: fType
          });
        }
      });

      toSort.sort(function (a, b) {
        return a.menuName.localeCompare(b.menuName);
      });

      menuList(toSort);
      menuOpenDir();
    });
  };

  menuList = function menuList(items) {
    if (items.length === 0) {
      CommandManager.register("- empty -", "anyTplNull", function () {
        showModal("Add files to your templates folder in order to make them available in the \"Template\" menu. <br>Once you add files, restart Brackets.");
      });

      Menus.getMenu("anyTplMenu").addMenuItem("anyTplNull");
    } else {
      items.forEach(function (data, i) {
        CommandManager.register(data.menuName, "anyTpl" + i, function () {
          selectedItem = data;
          selectActionModal();
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

  selectActionModal = function selectActionModal() {
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
      switch (id) {
        case "overwrite":
          onOverwrite();
          break;
        case "untitled":
          onUntitled();
          break;
      }
    });
  };

  onOverwrite = function onOverwrite() {
    var currDoc = DocumentManager.getCurrentDocument(),
        currType = void 0;

    if (currDoc) {
      currType = FileUtils.getFilenameWithoutExtension(currDoc.file.name) ? FileUtils.getFileExtension(currDoc.file.name).toLowerCase() : ".";
    }

    if (selectedItem.type !== currType) {
      showModal("You cannot overwrite this file because it is of a different type. <br>Please choose to create an untitled document instead.").done(function () {
        selectActionModal();
      });
    } else {
      selectedItem.file.read(function (err, data) {
        if (err) {
          onReadErr(err);
        } else {
          DocumentManager.getCurrentDocument().setText(data);
        }
      });
    }
  };

  onUntitled = function onUntitled() {
    var newDoc = void 0;

    selectedItem.file.read(function (err, data) {
      if (err) {
        onReadErr(err);
      } else {
        newDoc = DocumentManager.createUntitledDocument(count, selectedItem.type ? "." + selectedItem.type : "");

        newDoc.setText(data);
        CommandManager.execute(Commands.CMD_OPEN, newDoc.file);
      }
    });
  };

  onReadErr = function onReadErr(err) {
    showModal("There was an error loading your template file. Check your templates folder and restart Brackets.");
    console.error("Template Error:", err);
  };

  showModal = function showModal() {
    for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
      rest[_key] = arguments[_key];
    }

    return Dialogs.showModalDialog.apply(Dialogs, ["anyTpl", "Any Template"].concat(rest));
  };

  AppInit.appReady(init);
});
