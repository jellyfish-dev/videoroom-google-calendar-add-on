# Videoroom Google Add-on

This add-on enables you to add Videoroom link to your Google Calendar events.

## Before you begin

This sample requires the following:

- [Node.js][node] is installed with `npm` and `npx` commands.

## Deploy the add-on

Deploy the add-on by following these steps:

1. Authorize clasp to manage your scripts

        npx @google/clasp login

2. Create a new project:

        npx @google/clasp create --type standalone --title "Videoroom Add-on"

3. Push the code:

        npx @google/clasp push -f

## Install the add-on

Once the add-on is deployed, install the add-on on your account using these steps:

1. Open the project

        npx @google/clasp open

2. In the Apps Script editor, select **Publish > Deploy from manifest...** to open the _Deployments_ dialog.

3. In the **Latest Version (Head)** row, click **Install add-on** to install the currently saved version of the add-on in development-mode.

## Run the add-on

1. Open [Calendar][calendar]. If Calendar was open prior to enabling the add-on,
   you may need to refresh the tab.

2. Click the to add a new event. And select for drop down menu Videoroom Add-on.

3. Probably you will need to authorize Add-on. When asked click the **Authorize** link
   to open a dialog where you can authorize the add-on.

4. Select the account that should authorize the add-on.

5. Read the notice in the next dialog carefully, then click **Allow**.

6. Once authorized, you can use the add-on.

7. Addon generates a random link to the Videoroom meeting. If you change event title, addon will generate new link based on the title.
   To see the new link, you need to refresh the page and wait for the sync.

<!-- References -->

[node]: https://nodejs.org/en/
[calendar]: https://calendar.google.com/calendar/
