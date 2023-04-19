/**
 *  Initializes syncing of conference data by creating a sync trigger and
 *  sync token if either does not exist yet.
 *
 *  @param {String} calendarId The ID of the Google Calendar.
 */
function initializeSyncing(calendarId) {
    // Create a syncing trigger if it doesn't exist yet.
    createSyncTrigger(calendarId);

    // Perform an event sync to create the initial sync token.
    syncEvents({ 'calendarId': calendarId });
}

/**
 *  Creates a sync trigger if it does not exist yet.
 *
 *  @param {String} calendarId The ID of the Google Calendar.
 */
function createSyncTrigger(calendarId) {
    // Check to see if the trigger already exists; if does, return.
    let allTriggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < allTriggers.length; i++) {
        let trigger = allTriggers[i];
        if (trigger.getTriggerSourceId() == calendarId) {
            return;
        }
    }

    // Trigger does not exist, so create it. The trigger calls the
    // 'syncEvents()' trigger function when it fires.
    const _trigger = ScriptApp.newTrigger('syncEvents')
        .forUserCalendar(calendarId)
        .onEventUpdated()
        .create();
}

/**
 *  Sync events for the given calendar; this is the syncing trigger
 *  function. If a sync token already exists, this retrieves all events
 *  that have been modified since the last sync, then checks each to see
 *  if an associated conference needs to be updated and makes any required
 *  changes. If the sync token does not exist or is invalid, this
 *  retrieves future events modified in the last 24 hours instead. In
 *  either case, a new sync token is created and stored.
 *
 *  @param {Object} e If called by a event updated trigger, this object
 *      contains the Google Calendar ID, authorization mode, and
 *      calling trigger ID. Only the calendar ID is actually used here,
 *      however.
 */
function syncEvents(e) {
    const calendarId = e.calendarId;
    const properties = PropertiesService.getUserProperties();
    const syncToken = properties.getProperty('syncToken');

    let options;
    if (syncToken) {
        // There's an existing sync token, so configure the following event
        // retrieval request to only get events that have been modified
        // since the last sync.
        options = {
            syncToken: syncToken
        };
    } else {
        // No sync token, so configure to do a 'full' sync instead. In this
        // example only recently updated events are retrieved in a full sync.
        // A larger time window can be examined during a full sync, but this
        // slows down the script execution. Consider the trade-offs while
        // designing your add-on.
        let now = new Date();
        let yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        options = {
            timeMin: now.toISOString(),          // Events that start after now...
            updatedMin: yesterday.toISOString(), // ...and were modified recently
            maxResults: 50,   // Max. number of results per page of responses
            orderBy: 'updated'
        }
    }

    // Examine the list of updated events since last sync (or all events
    // modified after yesterday if the sync token is missing or invalid), and
    // update any associated conferences as required.
    let events;
    let pageToken;
    do {
        try {
            options.pageToken = pageToken;
            events = Calendar.Events.list(calendarId, options);
        } catch (err) {
            // Check to see if the sync token was invalidated by the server;
            // if so, perform a full sync instead.
            if (err.message ===
                "Sync token is no longer valid, a full sync is required.") {
                properties.deleteProperty('syncToken');
                syncEvents(e);
                return;
            } else {
                throw new Error(err.message);
            }
        }

        // Read through the list of returned events looking for conferences
        // to update.
        if (events.items && events.items.length > 0) {
            for (let i = 0; i < events.items.length; i++) {
                let calEvent = events.items[i];
                // Check to see if there is a record of this event has a
                // conference that needs updating.
                if (eventHasConference(calEvent)) {
                    updateConference(calEvent, calendarId);
                }
            }
        }

        pageToken = events.nextPageToken;
    } while (pageToken);

    // Record the new sync token.
    if (events.nextSyncToken) {
        properties.setProperty('syncToken', events.nextSyncToken);
    }
}

/**
 *  Returns true if the specified event has an associated conference
 *  of the type managed by this add-on; retuns false otherwise.
 *
 *  @param {Object} calEvent The Google Calendar event object, as defined by
 *      the Calendar API.
 *  @return {boolean}
 */
function eventHasConference(calEvent) {
    var name = calEvent?.conferenceData?.conferenceSolution?.name || null;

    // This version checks if the conference data solution name matches the
    // one of the solution names used by the add-on. Alternatively you could
    // check the solution's entry point URIs or other solution-specific
    // information.
    if (name) {
        if (name === VIDEO_ROOM) {

            return true;
        }
    }
    return false;
}


function updateConference(calEvent, calendarId) {

    // Update the calEvent.conferenceData object directly
    calEvent.conferenceData.entryPoints[0].uri = createRoomUrl(calEvent.summary);

    // Make a request to the external API to get a new name
    const response = UrlFetchApp.fetch("https://names.drycodes.com/1?combine=4");

    const eventId = calEvent.id;
    const options = {
        conferenceDataVersion: 1
    };

    // Pass the whole calEvent object, including start and end properties, to the update method
    Calendar.Events.update(calEvent, calendarId, eventId, options);
}
