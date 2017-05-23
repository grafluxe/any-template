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
      init,
      prefs,
      initModule,
      selectDir,
      setPath,
      setMenu,
      getTemplates,
      menuList,
      menuOpenDir,
      selectActionModal,
      onOverwrite,
      onUntitled,
      onReadErr,
      count = 10,
      showModal,
      selectedItem;

  init = () => {
    prefs = PreferencesManager.getExtensionPrefs("anyTemplate");
    templatesPath = prefs.get("templatesPath");

    MainViewManager.on("workingSetAdd", () => count++);

    if (templatesPath) {
      setMenu();
      getTemplates();
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
    ).done(id => {
      if (id === "select") {
        setPath();
      }
    });
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
      getTemplates();
    }
  };

  setMenu = () => {
    Menus.addMenu("Template", "anyTplMenu", Menus.AFTER, Menus.AppMenuBar.NAVIGATE_MENU);
  };

  getTemplates = () => {
    FileSystem.getDirectoryForPath(templatesPath).getContents((a, files) => {
      let toSort = [],
          fName,
          fType;

      files.forEach((el) => {
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

      toSort.sort((a, b) => a.menuName.localeCompare(b.menuName));

      menuList(toSort);
      menuOpenDir();
    });
  };

  menuList = (items) => {
    if (items.length === 0) {
      CommandManager.register("- empty -", "anyTplNull", () => {
        showModal("Add files to your templates folder in order to make them available in the \"Template\" menu. <br>Once you add files, restart Brackets.");
      });

      Menus.getMenu("anyTplMenu").addMenuItem("anyTplNull");
    } else {
      items.forEach((data, i) => {
        CommandManager.register(data.menuName, "anyTpl" + i, () => {
          selectedItem = data;
          selectActionModal();
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

  selectActionModal = () => {
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

  onOverwrite = () => {
     let currDoc = DocumentManager.getCurrentDocument(),
         currType;

    if (currDoc) {
      currType = (FileUtils.getFilenameWithoutExtension(currDoc.file.name) ? FileUtils.getFileExtension(currDoc.file.name).toLowerCase() : ".");
    }

    if (selectedItem.type !== currType) {
      showModal("You cannot overwrite this file because it is of a different type. <br>Please choose to create an untitled document instead.").done(() => {
        selectActionModal();
      });
    } else {
      selectedItem.file.read((err, data) => {
        if (err) {
          onReadErr(err);
        } else {
          DocumentManager.getCurrentDocument().setText(data);
        }
      });
    }
  };

  onUntitled = () => {
    let newDoc;

    selectedItem.file.read((err, data) => {
      if (err) {
        onReadErr(err);
      } else {
        newDoc = DocumentManager.createUntitledDocument(count, (selectedItem.type ? "." + selectedItem.type : ""));

        newDoc.setText(data);
        CommandManager.execute(Commands.CMD_OPEN, newDoc.file);
      }
    });
  };

  onReadErr = (err) => {
    showModal("There was an error loading your template file. Check your templates folder and restart Brackets.");
    console.error("Template Error:", err);
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
