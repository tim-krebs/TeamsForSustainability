import { TeamsUserCredential, createMicrosoftGraphClient, ErrorWithCode } from "@microsoft/teamsfx";
import { Client } from '@microsoft/microsoft-graph-client';
import * as Helpers from "../services/Helpers";

// App ID must be same in state.[YOUR ENV].json e.g. state.local.jsons
// You will find the id in the 'fx-resource-appstudio' section of the app
var manifestAppId = "c925bc22-105e-475c-8aed-da23bfae40c1";
const contentUrl = `https://${window.location.hostname}:${window.location.port}` + "/index.html#/tab";

let graphClient: Client;
let clientInit: boolean = false;

/**
 * Returns the Graph client
 * @returns GraphClient
 */
async function getGraphClient(): Promise<Client> {
  if (!clientInit) {
    const scope = ["User.Read",
      "User.Read.All",
      "Calendars.Read",
      "Chat.Read",
      "Calendars.ReadWrite",
      "OnlineMeetings.Read",
      "OnlineMeetings.ReadWrite",
      "AppCatalog.Submit",
      "AppCatalog.Read.All",
      "AppCatalog.ReadWrite.All",
      "Directory.Read.All", "Directory.ReadWrite.All",
      "TeamsAppInstallation.ReadWriteSelfForChat",
      "TeamsAppInstallation.ReadWriteForChat",
      "TeamsTab.Create",
      "TeamsTab.ReadWriteForChat",
      "TeamsTab.ReadWrite.All"];
    const credential = new TeamsUserCredential();
    const token = await credential.getToken(scope);

    // Important: tokens are stored in sessionStorage, read more here: https://aka.ms/teamsfx-session-storage-notice
    graphClient = createMicrosoftGraphClient(credential, scope);
    clientInit = true;
  }
  return graphClient;
}

/**
 * Get the current logged in user 
 */
export async function getCurrentUser() {

  try {
    console.log("GraphAPI : GetUserProfile : Call GetUserProfile")

    const graph = await getGraphClient();

    console.log("GraphAPI : GetUserProfile : Graph client sucessfuly created");

    const profile = await graph.api("/me?$select=country,city,mobilePhone,displayName,mail").get();
    let location;
    let photoUrl = "";
    try {
      const photo = await graph.api("/me/photo/$value").get();
      photoUrl = URL.createObjectURL(photo);
    } catch {
      // Could not fetch photo from user's profile, return empty string as placeholder.
    }

    return { profile, photoUrl, location }

  } catch (err: unknown) {
    console.log("GraphAPI : GetUserProfile : Error > Call GetUserProfile")

    if (err instanceof ErrorWithCode && err.message?.includes("CancelledByUser")) {
      const helpLink = "https://aka.ms/teamsfx-auth-code-flow";
      err.message +=
        "\nIf you see \"AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application\" " +
        "in the popup window, you may be using unmatched version for TeamsFx SDK (version >= 0.5.0) and Teams Toolkit (version < 3.3.0) or " +
        `cli (version < 0.11.0). Please refer to the help link for how to fix the issue: ${helpLink}`;
    }
    throw err;
  }
}

/**
 * Get a user by their email address or user id
 * @param id 
 */
export async function getUserById(id: string) {

  try {
    console.log("GraphAPI : GetUserProfile : Call GetUserProfile")

    const graph = await getGraphClient();

    console.log("GraphAPI : GetUserProfile : Graph client sucessfuly created");

    const profile = await graph.api("/users/" + id + "?$select=country,city,mobilePhone,displayName,mail").get();
    let location;
    let photoUrl = "";
    try {
      const photo = await graph.api("/users/" + id + "/photo/$value").get();
      photoUrl = URL.createObjectURL(photo);
    } catch {
      // Could not fetch photo from user's profile, return empty string as placeholder.
    }

    return { profile, photoUrl, location }

  } catch (err: unknown) {
    console.log("GraphAPI : GetUserProfile : Error > Call GetUserProfile")

    if (err instanceof ErrorWithCode && err.message?.includes("CancelledByUser")) {
      const helpLink = "https://aka.ms/teamsfx-auth-code-flow";
      err.message +=
        "\nIf you see \"AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application\" " +
        "in the popup window, you may be using unmatched version for TeamsFx SDK (version >= 0.5.0) and Teams Toolkit (version < 3.3.0) or " +
        `cli (version < 0.11.0). Please refer to the help link for how to fix the issue: ${helpLink}`;
    }
  }
}

/**
 * Get chat attendees for a given chat id
* @param chatId The chat id
*/
export async function getChatAttendees(chatId: string) {

  try {
    console.log("GraphAPI :Call getChatAttendees")

    const graph = await getGraphClient();

    const attendees = await graph.api("/chats/" + chatId + "/members").get();

    return attendees.value;

  } catch (err: unknown) {
    console.log("GraphAPI : getChatAttendees : Error > Call getChatAttendees")

    if (err instanceof ErrorWithCode && err.message?.includes("CancelledByUser")) {
      const helpLink = "https://aka.ms/teamsfx-auth-code-flow";
      err.message +=
        "\nIf you see \"AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application\" " +
        "in the popup window, you may be using unmatched version for TeamsFx SDK (version >= 0.5.0) and Teams Toolkit (version < 3.3.0) or " +
        `cli (version < 0.11.0). Please refer to the help link for how to fix the issue: ${helpLink}`;
    }
    throw err;
  }
}

/**
 * Get online meeeting 
 * @param chatId The chat id 
 */
export async function getMeeting(chatId: string) {

  console.log("GraphAPI : getMeeting for chat id " + chatId)

  let graph;
  let chat;
  let meeting: any;

  // Get graph client 
  try {
    graph = await getGraphClient();
  } catch (err: unknown) {
    throw new Error('The user or administrator has not consented to use the application yet.');
  }

  // Get chat by chat id
  try {
    chat = await graph.api("/chats/" + chatId).get();
    console.log("GraphAPI : getMeeting : Chat fetched");
    console.log(chat);
  } catch (err: unknown) {
    throw new Error('Can\'t get chat with id ' + chatId + " : " + err);
  }

  // Get meeting by chat id and join web url
  try {
    let meetings = await graph?.api("https://graph.microsoft.com/v1.0/me/events/").get()

    // Dirty workaround for the fact that the calendar event id is different for each meeting and each user
    //meeting = await graph.api("https://graph.microsoft.com/v1.0/me/events/" + chat?.onlineMeetingInfo.calendarEventId).get();
    meeting = Helpers.getMeetingByJoinUrl(chat?.onlineMeetingInfo.joinWebUrl, meetings.value);
    if (!meeting) {
      throw new Error('Can\'t get meeting with id ' + chat?.onlineMeetingInfo.joinWebUrl);
    }
    console.log(meeting);

  } catch (err: unknown) {
    throw new Error("Error" + err);
  }

  return meeting;
}

/** 
 * Update meeting (only subject and location!)
 * @param meeting the meeting to update 
 */
export async function updateMeeting(meeting?: any) {
  try {

    console.log("GraphAPI : UpdateMeeting : meeting id " + meeting.id);

    const graph = await getGraphClient();

    console.log("GraphAPI : UpdateMeeting : Graph client sucessfuly created");

    const event = {
      subject: meeting?.subject,
      location: {
        displayName: meeting?.location.displayName,
        uniqueId: meeting?.location.displayName
      }
    };

    try {
      await graph.api("/me/events/" + meeting.id).update(event);

    } catch (err: unknown) {
      console.log("Error: /me/events ")
    }

  } catch (error) {

  }
}

/**
 * Adds the TFS app to the meeting based on the joinUrl provided
 * The app needs to be installed in the tenant: Admin Center - Manage Apps
 * TODO: Exception Handling
 * @param onlineMeetingJoinUrl 
 */
export async function addAppToMeeting(onlineMeetingJoinUrl: string): Promise<string> {
  let addAppResult: string = "error";
  try {
    // How to get config dynamically from environment
    // Only do this once and store id per tenant in database

    const graph = await getGraphClient();

    // Get the chat id 
    let onlineMeeting = await graph.api("/me/onlineMeetings").filter("JoinWebUrl eq '" + onlineMeetingJoinUrl + "'").get();
    const chatId = onlineMeeting.value[0].chatInfo.threadId;

    // Get the app id
    let app = await graph.api("/appCatalogs/teamsApps").filter("externalId eq '" + manifestAppId + "'").get();
    const appId = "https://graph.microsoft.com/beta/appCatalogs/teamsApps/" + app.value[0].id;

    // Add the app
    const body3 = {
      "teamsApp@odata.bind": appId
    };
    let appAdded = await graph.api("/chats/" + chatId + "/installedApps").post(body3);

    // Add the tab
    const body4 = {
      "displayName": "TFS",
      "teamsApp@odata.bind": appId,
      "configuration": {
        "entityId": "TFS",
        "contentUrl": contentUrl,
        "websiteUrl": contentUrl
      }
    };
    let tabAdded = await graph.api("/chats/" + chatId + "/tabs").post(body4);
    console.log("GraphAPI : App added to Meeting");
    addAppResult = "success";
  }
  catch (error) {
    console.log("GraphAPI : Error adding app to meeting");
  }
  return addAppResult;
}

export async function getInstalledMeetingApps(onlineMeetingJoinUrl: string): Promise<any> {
  let addAppResult: any;

  console.log(" GraphAPI : getInstalledMeetingApps ")

  try {
    // How to get config dynamically from environment
    // Only do this once and store id per tenant in database

    const graph = await getGraphClient();

    // Get the chat id 
    let onlineMeeting = await graph.api("/me/onlineMeetings").filter("JoinWebUrl eq '" + onlineMeetingJoinUrl + "'").get();
    console.log(onlineMeeting)
    const chatId = onlineMeeting.value[0].chatInfo.threadId;

    let query = "/chats/" + chatId + "/installedApps?$expand=teamsAppDefinition";
    console.log("Query = " + query)

    addAppResult = await graph.api(query).get();

  }
  catch (error) {
    console.log("GraphAPI : Error getting installed apps");
    return null;
  }
  return addAppResult.value;
}

export async function getOrganizedMeetings(organizerMail: string) {
  try {
    console.log("GraphAPI : GetOrganisiedMeetings for " + organizerMail)

    const graph = await getGraphClient();

    console.log("GraphAPI : GetUserProfile : Graph client sucessfuly created");

    let tmpMeetings;
    try {
      tmpMeetings = await graph.api("/me/events?$orderby=start/dateTime").get();
    } catch (err: unknown) {
      console.log("Error: /me/events ")
    }

    let meetings: any[] = [];

    // Manual filtering because of that
    // https://github.com/microsoftgraph/microsoft-graph-docs/issues/426
    tmpMeetings.value.forEach((element: any) => {
      if (element.organizer.emailAddress.address === organizerMail) {
        console.log(element)
        meetings.push(element)
      }
    });

    return meetings

  } catch (err: unknown) {
    console.log("GraphAPI : GetOrganisiedMeetings : Error > Call GetOrganisiedMeetings")

    if (err instanceof ErrorWithCode && err.message?.includes("CancelledByUser")) {
      const helpLink = "https://aka.ms/teamsfx-auth-code-flow";
      err.message +=
        "\nIf you see \"AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application\" " +
        "in the popup window, you may be using unmatched version for TeamsFx SDK (version >= 0.5.0) and Teams Toolkit (version < 3.3.0) or " +
        `cli (version < 0.11.0). Please refer to the help link for how to fix the issue: ${helpLink}`;
    }
    throw err;
  }
}
