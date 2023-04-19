const VIDEO_ROOM = 'Videoroom';
const BASE_URL = 'https://videoroom.membrane.work/room/';

/**
 *  Creates a conference, then builds and returns a ConferenceData object
 *  with the corresponding conference information. This method is called
 *  when a user selects a conference solution defined by the add-on that
 *  uses this function as its 'onCreateFunction' in the add-on manifest.
 *
 *  @param {Object} arg The default argument passed to a 'onCreateFunction';
 *      it carries information about the Google Calendar event.
 *  @return {ConferenceData}
 */
function createConference(arg) {
  const eventData = arg.eventData;
  const calendarId = eventData.calendarId;
  const eventId = eventData.eventId;

  // Retrieve the Calendar event information using the Calendar
  // Advanced service.
  let calendarEvent;
  try {
    calendarEvent = Calendar.Events.get(calendarId, eventId);
  } catch (err) {
    // The calendar event does not exist just yet; just proceed with the
    // given event ID and allow the event details to sync later.
    calendarEvent = {
      id: eventId,
    };
  }

  // Create a conference on the third-party service and return the
  // conference data or errors in a custom JSON object.
  const conferenceInfo = create3rdPartyConference(calendarEvent);

  // Build and return a ConferenceData object, either with conference or
  // error information.
  const dataBuilder = ConferenceDataService.newConferenceDataBuilder();

  if (!conferenceInfo.error) {
    // No error, so build the ConferenceData object from the
    // returned conference info.
    setConferenceData(dataBuilder, conferenceInfo);

    initializeSyncing(calendarId);

  } else {
    // Other error type;
    const error =
      ConferenceDataService.newConferenceError().setConferenceErrorType(
        ConferenceDataService.ConferenceErrorType.TEMPORARY
      );
    dataBuilder.setError(error);
  }

  // Don't forget to build the ConferenceData object
  return dataBuilder.build();
}

/**
 *  Contact the third-party conferencing system to create a conference there,
 *  using the provided calendar event information. Collects and retuns the
 *  conference data returned by the third-party system in a custom JSON object
 *  with the following fields:
 *
 *    data.adminEmail - the conference administrator's email
 *    data.conferenceLegalNotice - the conference legal notice text
 *    data.error - Only present if there was an error during
 *         conference creation. Equal to 'AUTH' if the add-on user needs to
 *         authorize on the third-party system.
 *    data.id - the conference ID
 *    data.phoneNumber - the conference phone entry point phone number
 *    data.phonePin - the conference phone entry point PIN
 *    data.videoPasscode - the conference video entry point passcode
 *    data.videoUri - the conference video entry point URI
 *
 *  The above fields are specific to this example; which conference information
 *  your add-on needs is dependent on the third-party conferencing system
 *  requirements.
 *
 * @param {Object} calendarEvent A Calendar Event resource object returned by
 *     the Google Calendar API.
 * @return {Object}
 */
function create3rdPartyConference(calendarEvent) {
  const response = UrlFetchApp.fetch('https://names.drycodes.com/1?combine=4');
  const name = JSON.parse(response.getContentText());

  const data = {
    id: calendarEvent.id,
    roomName: name,
  };

  return data;
}

function createRoomUrl(roomName) {
  return BASE_URL + encodeURIComponent(roomName);
}

function setConferenceData(dataBuilder, conferenceInfo) {
  const roomParameter = ConferenceDataService.newConferenceParameter()
    .setKey('roomName')
    .setValue(conferenceInfo.roomName);

  dataBuilder
    .setConferenceId(conferenceInfo.id)
    .addConferenceParameter(roomParameter);

  const videoEntryPoint = ConferenceDataService.newEntryPoint()
    .setEntryPointType(ConferenceDataService.EntryPointType.VIDEO)
    .setUri(createRoomUrl(conferenceInfo.roomName));

  dataBuilder.addEntryPoint(videoEntryPoint);
}

