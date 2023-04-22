# test-mode
## db model:
  * new table pruefung
    * id
    * name (e.g. "1. Stegreifaufgabe")
    * klasse_id
    * template_workspace_id
    * state: varchar(20)
      * values: preparing, running, correcting, opening
  * new column workspace.pruefung_id
    
## teacher-frontend
  * Accordion "Klassen" gets caption with buttons "Klassen" and "Prüfungen" which enable toggling between class list and test list
  * Klick on "Prüfungen" shows lists with tests:
    * class.name + ": " + test.name
    * right-aligned: icon for state, icon with trash bin, icon with printer (only visible if state == "opening"), Icon "..."
    * "..." leads to Popup-Menu with entries
      * "Prüfung starten", "Prüfung beenden", "Prüfung eröffnen"
      * only transitions preparing -> running <-> correcting <-> opening possible
      * running -> preparing is possible only if template hasn't been copied to student-workspaces
  * if "Prüfungen" is activ then caption-field shows button for "new test"
    * "new test"-button leads to popup where you can choose class
      * after choosing class: new test is visible and test-name (not class) is editable
  * if state is "preparing": student-list only shows "Vorlage". Klick on "Vorlage" opens template-workspace
  * if state is "correcting" or "opening": student-list shows list of students in class. Klick on student shows workspaces of tests to correct. workspaces are read-only if state is "opening"
  * klick on printer-symbol exports test as pdf:
    * for each student: 
      * test-name, student-name, list of files
      * for each file: original file-text and - if teacher did corrections - corrected file-text

## student-frontend
  * if test is running:
    * if student logs in she/he sees test-mode:
      * only test-workspace is visible
      * on first opening of test-mode: template-files are copied into test-workspace
    * if student is logged in while test-state changes to running: GUI switches into test-mode
    * in Test-Mode: Background of main menu is dark-red
    * in Test-Mode: client is saving data every 5 seconds
  * if test mode switches to "correcting": clients save test-workspaces, close them and switch to normal mode.
  * if there is at least one test for student then workspaces-tab shows folder "Prüfungen" (first in List) which contains all test-workspaces in state "opening".
  * click on test-workspace opens it in read-only-mode
