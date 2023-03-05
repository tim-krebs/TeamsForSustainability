/* This code sample provides a starter kit to implement server side logic for your Teams App in TypeScript,
 * refer to https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference for complete Azure Functions
 * developer guide.
 */

// Import polyfills for fetch required by msgraph-sdk-javascript.
import "isomorphic-fetch";
import { Context, HttpRequest } from "@azure/functions";
import { EmissionCalculator } from "./emissionCalculator";
import { Meeting } from "../lib/meeting";
import { SqlService } from "../lib/sqlService";
import { CalculationStatus } from "../lib/calculationStatus";
import {
  loadConfiguration,
  OnBehalfOfUserCredential,
  UserInfo,
} from "@microsoft/teamsfx";
import { SpatialServices } from "./SpatialServices";

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
    /*
    let sample = {
      "id":"123", 
      "title":"SCRUM Meeting", 
      "location":"Munich, Germany",
      "attendees": [
        {"id":"123", 
        "name":"SCRUM Meeting", 
        "location":"Stuttgart, Germany"},
        {"id":"123", 
        "name":"SCRUM Meeting", 
        "location":"Hamburg, Germany"},
        {"id":"123", 
        "name":"SCRUM Meeting", 
        "location":"Berlin, Germany"},
        {"id":"123", 
        "name":"SCRUM Meeting", 
        "location":"Köln, Germany"}
      ]
    };
    */   
    let sqlService = new SqlService();
    let meeting = new Meeting(req.body); 

    if(!meeting.isUpdate){
      let savedMeetings = await sqlService.getMeeting(meeting.id);
      if(savedMeetings.length > 0){ 
        let savedMeeting = savedMeetings[0];     
        let attendees = await sqlService.getAttendees(meeting.id);
        savedMeeting.attendees = attendees;
        res.body.meetingEmmission = sqlService.getMeetingJson(savedMeeting);      
        return res;
      }
    }
 
    let spatialServices = new SpatialServices();
    meeting.position = await spatialServices.getCoordinates(meeting.location);

    for (let attendee of meeting.attendees) {    
      attendee.position = [];
      attendee.distance = 0;
      attendee.emission = 0;  
      try{
        if(meeting.location.toLocaleLowerCase() == attendee.location.toLocaleLowerCase()){
          attendee.position = meeting.position;
          attendee.calculationStatus = CalculationStatus.success;
        }else{
          const position = await spatialServices.getCoordinates(attendee.location);
          if(position == null){
            throw "Error: Attendee position not found";
          }else{
            attendee.position = position;
            attendee.distance = await spatialServices.getDistance(attendee.position, meeting.position);
            attendee.emission = await EmissionCalculator.getSavedEmission(attendee.distance);
            attendee.emissionType = EmissionCalculator.getEmissionType(attendee.distance);      
            attendee.calculationStatus = CalculationStatus.success;
            if(meeting.organizerId == attendee.id){
              attendee.isOrganizer = 1;
            }
            else {
              attendee.isOrganizer = 0;
            }
          }
          meeting.addEmission(attendee.emission);    
          meeting.calculationStatus = CalculationStatus.success;
        }
      } catch (error) {
        console.error(error);
        attendee.calculationStatus = CalculationStatus.error;
        meeting.calculationStatus = CalculationStatus.error;
      }      
    
  }
    res.body.meetingEmmission = meeting;
    sqlService.saveMeeting(meeting);
        
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