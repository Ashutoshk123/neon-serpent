# Prompt for the browser agent

Copy everything inside the box below and paste it as your message to the Claude
browser agent. Make sure you are **already logged into github.com** in that browser
first, because the agent cannot log in for you.

---

```
Deploy a static browser game to GitHub Pages for me. I am already logged into GitHub in
this browser. Work through the steps below in order and tell me if anything looks different
from what I describe.

SOURCE FILES (on my computer):
Folder: C:\Users\ashut\OneDrive\Documents\Claude Project\Snake Game\

Upload exactly these 13 files, nothing else:
  Root level (3 files):
    index.html
    manifest.webmanifest
    icon.svg
  Inside a folder named "js" (10 files):
    js\ns-core.js
    js\rng.js
    js\juice.js
    js\profile.js
    js\skins.js
    js\achievements.js
    js\shop.js
    js\progression.js
    js\mutations.js
    js\draft.js

Do NOT upload these, they are local-only helpers:
    start-server.bat
    phone-server.js
    LINKEDIN-POST.md
    DEPLOY-PROMPT.md

The folder structure matters. index.html loads the scripts with paths like
"js/ns-core.js", so all ten .js files must end up inside a folder called js, not at
the root. If they land at the root the game will load a blank screen.

STEP 1 - Create the repository
  Go to https://github.com/new
  Repository name: neon-serpent
  Description: A browser snake roguelite. No libraries, no image or audio files.
  Visibility: Public
  Do not tick "Add a README file" or any other initialisation option.
  Click "Create repository".
  Tell me the full repository URL once it exists.

STEP 2 - Create the js folder
  GitHub cannot create an empty folder, so make it by creating a file inside it.
  On the repository page click "Add file" then "Create new file".
  In the filename box type exactly:  js/placeholder.md
  (typing the slash creates the folder)
  Put this single line in the file body:  Game modules live in this folder.
  Click "Commit changes" and confirm the commit in the dialog.

STEP 3 - Upload the three root files
  Go back to the repository root (click the repository name at the top).
  Click "Add file" then "Upload files".
  Use the "choose your files" link to open the file picker, navigate to
  C:\Users\ashut\OneDrive\Documents\Claude Project\Snake Game\
  and select these three together: index.html, manifest.webmanifest, icon.svg
  Wait until all three appear in the upload list, then click "Commit changes".

STEP 4 - Upload the ten script files
  On the repository page, click into the "js" folder.
  Click "Add file" then "Upload files".
  Open the file picker, navigate into the "js" subfolder of the same directory, and
  select all ten .js files at once (Ctrl+A inside that folder works).
  Confirm all ten are listed, then click "Commit changes".
  Verify the js folder now shows 11 files (10 scripts plus placeholder.md).

STEP 5 - Turn on GitHub Pages
  Open the repository "Settings" tab.
  In the left sidebar click "Pages".
  Under "Build and deployment", set Source to "Deploy from a branch".
  Set Branch to "main" and the folder to "/ (root)".
  Click "Save".
  The page will show a URL like https://USERNAME.github.io/neon-serpent/
  Report that exact URL to me.

STEP 6 - Verify it actually works
  Wait about two minutes for the first deploy, then open the Pages URL in a new tab.
  Confirm you can see the animated "NEON SERPENT" start screen with a Play button.
  Open the browser console and check for any 404 errors on the js files. A blank or
  black screen almost always means the js files went to the wrong place.
  If you see 404s, tell me which files failed instead of trying to fix it yourself.

FINALLY, report back with:
  1. The live game URL
  2. The repository URL
  3. Whether the start screen rendered correctly
  4. Any console errors you saw

Rules while doing this:
  - Ask me before doing anything I have not listed above.
  - Do not change any file contents.
  - Do not create, delete or rename anything other than what is described.
  - If a page looks different from my description, stop and describe what you see.
```

---

## Agar agent atak jaaye

**"choose your files" picker mein folder select nahi ho raha** — normal hai, picker
sirf files leta hai, isliye Step 2 mein folder pehle bana rahe hain. Files ek-ek karke
nahi, saath mein select karo (Ctrl+A).

**Pages ka option nahi dikh raha** — repository Private hai. Settings ke sabse neeche
"Change repository visibility" se Public karo.

**Link khulta hai par screen kaali hai** — js files galat jagah chali gayi hain. Repo
root pe dekho, agar `ns-core.js` wahan dikh rahi hai to use `js` folder mein hona chahiye
tha. Un 10 files ko root se delete karke Step 4 dobara karo.

**404 page aa raha hai** — deploy abhi chal raha hoga. 2-3 minute ruk ke refresh karo.
Settings → Pages pe green tick aane ka wait karo.
