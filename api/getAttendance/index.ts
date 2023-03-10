/* This code sample provides a starter kit to implement server side logic for your Teams App in TypeScript,
 * refer to https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference for complete Azure Functions
 * developer guide.
 */

// Import polyfills for fetch required by msgraph-sdk-javascript.
import "isomorphic-fetch";
import { Context, HttpRequest } from "@azure/functions";
import { SqlService } from "../lib/sqlService";
import {
  loadConfiguration,
  OnBehalfOfUserCredential,
  UserInfo,
} from "@microsoft/teamsfx";

interface Response {
  status: number;
  body: { [key: string]: any };
}

type TeamsfxContext = { [key: string]: any };

/**
 * This function handles requests from teamsfx client.
 * The HTTP request should contain an SSO token queried from Teams in the header.
 * Before trigger this function, teamsfx binding would process the SSO token and generate teamsfx configuration.
 *
 * This function initializes the teamsfx SDK with the configuration and calls these APIs:
 * - OnBehalfOfUserCredential() - Construct credential with the received SSO token and initialized configuration.
 * - getUserInfo() - Get the user's information from the received SSO token.
 * - createMicrosoftGraphClient() - Get a graph client to access user's Microsoft 365 data.
 *
 * The response contains multiple message blocks constructed into a JSON object, including:
 * - An echo of the request body.
 * - The display name encoded in the SSO token.
 * - Current user's Microsoft 365 profile if the user has consented.
 *
 * @param {Context} context - The Azure Functions context object.
 * @param {HttpRequest} req - The HTTP request.
 * @param {teamsfxContext} TeamsfxContext - The context generated by teamsfx binding.
 */
export default async function run(
  context: Context,
  req: HttpRequest,
  teamsfxContext: TeamsfxContext
): Promise<Response> {
  context.log("HTTP trigger function processed a request.");

  // Initialize response.
  const res: Response = {
    status: 200,
    body: {},
  };

  // Put an echo into response body.
  //res.body.receivedHTTPRequestBody = req.body || "";

  // Set default configuration for teamsfx SDK.
  try {
    loadConfiguration();
  } catch (e) {
    context.log.error(e);
    return {
      status: 500,
      body: {
        error: "Failed to load app configuration.",
      },
    };
  }

  // Prepare access token.
  const accessToken: string = teamsfxContext["AccessToken"];
  if (!accessToken) {
    return {
      status: 400,
      body: {
        error: "No access token was found in request header.",
      },
    };
  }

  // Construct credential.
  let credential: OnBehalfOfUserCredential;
  try {
    credential = new OnBehalfOfUserCredential(accessToken);
  } catch (e) {
    context.log.error(e);
    return {
      status: 500,
      body: {
        error:
          "Failed to obtain on-behalf-of credential using your accessToken. " +
          "Ensure your function app is configured with the right Azure AD App registration.",
      },
    };
  }

  // Query user's information from the access token.
  try {
    const currentUser: UserInfo = credential.getUserInfo();
    if (currentUser && currentUser.displayName) {
      res.body.userInfo = currentUser.displayName;
    } else {
      res.body.userInfo = "No user information was found in access token.";
    }
  } catch (e) {
    context.log.error(e);
    return {
      status: 400,
      body: {
        error: "Access token is invalid.",
      },
    };
  }

  // Create a graph client to access user's Microsoft 365 data after user has consented.
  try {
    
    // Existing Sample Code
    /*
    const graphClient: Client = createMicrosoftGraphClient(credential, [".default"]);
    const profile: any = await graphClient.api("/me").get();
    res.body.graphClientMessage = profile;
    */

    // New TFS Code
    let sqlService = new SqlService();
    res.body.attendance = await sqlService.getAttendance(req.query.userId);
    /*
    res.body.attendance = //sqlService.getAttendance(req.params.userId);
    {
      attendance: [
        {
          SavedEmission: 250,
          Location: "Berlin, Germany",
          PositionLon: 12.9857,
          PositionLat: 8.3214,
          UserID: "me@geek.onmicrosoft.com",
          Username: "Michael",
          TravelType: "Air Travel",
          OnlineMeetingID: "AAMkAGMzMzFiMzEyLTYyMmMtNDRmYS05NzI0LWU5MWNjZmE4ODhmNwBGAAAAAAAG4jlHIKdjTbhtIugUrtoYBwBwtVOUUy6tSYeOqZkyKpeWAAAAAAENAABwtVOUUy6tSYeOqZkyKpeWAAc2gMvJAAA=",
          Distance: 800,
          ID: "5",
          StartTime: "2022-04-20T13:30"
        },
        {
          SavedEmission: 180,
          Location: "Hamburg, Germany",
          PositionLon: 11.9857,
          PositionLat: 9.3214,
          UserID: "me@geek.onmicrosoft.com",
          Username: "Michael",
          TravelType: "Air Travel",
          OnlineMeetingID: "AAMkAGMzMzFiMzEyLTYyMmMtNDRmYS05NzI0LWU5MWNjZmE4ODhmNwBGAAAAAAAG4jlHIKdjTbhtIugUrtoYBwBwtVOUUy6tSYeOqZkyKpeWAAAAAAENAABwtVOUUy6tSYeOqZkyKpeWAAc2gMvJAAA=",
          Distance: 800,
          ID: "8",
          StartTime: "2022-04-21T13:30"
        },
        {
          SavedEmission: 80,
          Location: "K??ln, Germany",
          PositionLon: 11.9857,
          PositionLat: 9.3214,
          UserID: "me@geek.onmicrosoft.com",
          Username: "Michael",
          TravelType: "Air Travel",
          OnlineMeetingID: "AAMkAGMzMzFiMzEyLTYyMmMtNDRmYS05NzI0LWU5MWNjZmE4ODhmNwBGAAAAAAAG4jlHIKdjTbhtIugUrtoYBwBwtVOwertwertweWAAAAAAENAABwtVOUUy6tSYeOqZkyKpeWAAc2gMvJAAA=",
          Distance: 300,
          ID: "8",
          StartTime: "2022-04-22T13:30"
        },
        {
          SavedEmission: 130,
          Location: "M??nchen, Germany",
          PositionLon: 11.9857,
          PositionLat: 9.3214,
          UserID: "me@geek.onmicrosoft.com",
          Username: "Michael",
          TravelType: "Air Travel",
          OnlineMeetingID: "AAMkAGMzMzFiMzEyLTYyMmMtNDRmYS05NzI0LWU5MWNjZmE4ODhmNwBGAAAAAAAG4jlHIKdjTbhtIugUrtoYBwBwtVOUUy6tSYeOasdfasdfAAAAAENAABwtVOUUy6tSYeOqZkyKpeWAAc2gMvJAAA=",
          Distance: 200,
          ID: "9",
          StartTime: "2022-04-23T13:30"
        }
      ]
    };
    */
  } catch (e) {
    context.log.error(e);
    return {
      status: 500,
      body: {
        error:
          "Failed to retrieve meeting emissions.",
      },
    };
  }

  return res;
}