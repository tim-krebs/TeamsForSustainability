import { exit } from "process";

/**
 * Create a meeting payload object for the related azure function to do the emission calculation
 * @param meeting The meeting object
 * @param attendees All the attendees of the meeting
 * @param update Flag to indicate if the meeting and attendees should be updated (overwrite DB values)
 * @returns 
 */
export function createMeetingForEmissionCalculation(
  meeting: any,
  attendees: [],
  update: boolean = false) {
  try {

    /* SAMPLE
    const meetingDataDummy = {
        "id":"123", 
        "title":"SCRUM Meeting", 
        "location":"Munich, Germany",
        "attendees": [
          {"id":"234", 
          "name":"SCRUM Meeting", 
          "location":"Stuttgart, Germany"},
          {"id":"456", 
          "name":"SCRUM Meeting", 
          "location":"Hamburg, Germany"},
          {"id":"567", 
          "name":"SCRUM Meeting", 
          "location":"Berlin, Germany"},
          {"id":"678", 
          "name":"SCRUM Meeting", 
          "location":"Köln, Germany"}
        ]
      };
      */

    let meetingData: any = {};
    meetingData.id = meeting?.onlineMeeting?.joinUrl; // it seams that the joinUrl is the only unique and common identifier for a meeting
    meetingData.isUpdate = update;
    meetingData.title = meeting?.subject;
    meetingData.location = meeting?.location?.displayName;
    meetingData.organizerId = meeting?.organizer?.emailAddress?.address;
    meetingData.start = getValidDateTime(meeting?.start?.dateTime);
    meetingData.end = getValidDateTime(meeting?.end?.dateTime);
    meetingData.attendees = []

    attendees.forEach((p: any) => {
      let participant: any = {};
      participant.id = p.profile.mail;
      participant.name = p.profile.displayName;
      participant.location = p.profile.city + ", " + p.profile.country;
      participant.isUpdate = update;
      meetingData.attendees.push(participant)
    })

    return meetingData;
  } catch (error) {
    console.log("Helpers: createMeetingForEmissionCalculation : Error = " + error);
  }
}

/**
 * Get an object with city and country from a location string
 * @param location The location object like "Munich, Germany"
 * @returns object with city and country like {city: "Munich", country: "Germany"}
 */
export function getCityAndCountryFromString(location: string) {
  try {   
    if( !validateLocation(location)){
      throw new Error("Invalid location string");
    }

    let cityAndCountry = location.split(",");  
    return {
      city: cityAndCountry[0].trim(),
      country: cityAndCountry[1].trim()
    }
  } catch (error) { 
    console.log("Helpers: getCityAndCountryFromString : Error = " + error);
  }
}

function getValidDateTime(value: string){
    let index = value.indexOf('.');
    let substr = value.substring(0, index);
    return substr;
}

/**
 * Add the calculated emission to a attendee object
 * @param attendee The attendee object
 * @param emissions All the emissions which retrived from the API
 * @returns The updated attendee object
 */
export function addEmissionToAttendee(attendee: any, emissions: any) {

  emissions?.meetingEmmission?.attendees?.forEach((a: any) => {

    // Loop through all the attendees and add the emission to the given attendee object
    if (a.id === attendee?.profile?.mail) {
      attendee.emission = a.emission;
      attendee.emissionType = a.emissionType;
      attendee.distance = a.distance;
      attendee.calculationStatus = a.calculationStatus;
      attendee.location = {}; // Create a new object 
      attendee.location.lat = a.position[0];
      attendee.location.lon = a.position[1];  
      
      // Get the city and country from the location string
      let cityAndCountry = getCityAndCountryFromString(a.location);
      attendee.profile.city = cityAndCountry?.city;
      attendee.profile.country = cityAndCountry?.country;
      
      console.log("Helpers: addEmissionToAttendee : " + JSON.stringify(attendee));
      return;
    }
  })

  return attendee;
}

/**
 * 
 * @param attendee The attendee object
 * @param attendees The attendees array
 * @returns 
 */
export function addOrUpdateAttendeeFromAttendees(attendee: any, attendees: any[]) {

  try {
    let alreadyAttendee = false;
    attendees?.forEach((item: any, index) => {
       if (item.profile?.mail === attendee?.profile?.mail) {
        alreadyAttendee = true;        
      }
    });

    if( alreadyAttendee ) {

      console.log("Helpers : addOrUpdateAttendeeFromAttendees : " + alreadyAttendee );  
      attendees = removeAttendeeFromAttendees( attendee, attendees);      
    }

    attendees.push(attendee);

  } catch (error) {
    console.log("Helpers : addAttendeeFromAttendees : " + error );  
  }
  return attendees;
}

export function removeAttendeeFromAttendees(attendee: any, attendees: any[]) {

  try {
    attendees?.forEach((item: any, index) => {
      if (item.profile?.mail === attendee?.profile?.mail) attendees?.splice(index, 1);
    });
  } catch (error) {
    console.log("Helpers : removeAttendeeFromAttendees : " + error );  
  }
  return attendees;
}

export function isAppInstalled(appName: any, apps: any[]) {

  let installed = false;
  try {
    apps?.every((item: any) => {
      if (item.teamsAppDefinition?.displayName === appName) {
        installed = true;
        return false;  // return false means abort every loop            
      }
      return true;
    });
  } catch (error) {
    console.log("Helpers : removeAttendeeFromAttendees : " + error );  
  }
  return installed;
}

export function validateLocation(locationString: string) {
  let l = locationString.split(',')
  if (l.length === 2 && l[0] && l[1] && l[0].trim() && l[1].trim()) {
    return true
  }
  return false
}

export function sumSavedEmission( aArray: any[]) {

  let sum = 0;

  try {
    aArray?.forEach((item: any, index) => {
      sum += item.SavedEmission;
    });
  } catch (error) {
    console.log("Helpers : sumSavedEmission : " + error );  
  }
  return sum;
}

/**
 * Sum the number of all attendees of all the meetings
 * @param meetings The meetings array
 * @returns 
 */
export function sumAttendes( meetings: any[]) {

  let sum = 0;

  try {
    meetings?.forEach((item: any, index) => {
      sum += item.AttendeeCount;
    });
  } catch (error) {
    console.log("Helpers : sumAttendes : " + error );  
  }
  return sum;
}

/**
 * Convert CO2 to diesel
 * @param co2kg The CO2 in kg
 * @returns Diesel in liters
 */
export function savedDieselInLiter( co2kg : number) {

  //https://www.co2online.de/klima-schuetzen/mobilitaet/auto-co2-ausstoss/#c131031
  return Math.trunc(co2kg / 2.650);
}

/**
 * Convert CO2 to gasoline
 * @param co2kg The CO2 in kg
 * @returns Gas in liters
 */
export function savedGasolineInLiter( co2kg : number) {

  //https://www.co2online.de/klima-schuetzen/mobilitaet/auto-co2-ausstoss/#c131031
  return Math.trunc(co2kg / 2.370);
}

/**
 * Convert CO2 to meet
 * @param co2kg The CO2 in kg
 * @returns Meet in kg
 */
export function savedMeetInKg( co2kg : number) {

  //https://www.co2online.de/klima-schuetzen/mobilitaet/auto-co2-ausstoss/#c131031
  return Math.trunc(co2kg / 14.34);
}

/**
 * Get a meeting from the meetings array by join url
 * @param joinUrl The join url of the meeting
 * @param meetings The meetings array
 * @returns A meeting object if found, otherwise null
 */
export function getMeetingByJoinUrl(joinUrl: string, meetings: any[]) { 

  let meeting = null;
  try {
    meetings?.every((item: any) => {
      if (item.onlineMeeting?.joinUrl === joinUrl) {
        meeting = item;
        return false;  // return false means abort every loop            
      }
      return true;
    });
  } catch (error) { 
    console.log("Helpers : getMeetingByJoinUrl : " + error );  
  } 

  return meeting;
}

/**
 * Sort an array of attendees by the user name
 * @param attendees The attendees array
 * @returns The sorted attendees array
 */
export function sortAttendeesByUserName(attendees: any[]) {

  console.log("Helpers : sortAttendeesByUserName : start " + JSON.stringify(attendees));

  try {
    attendees?.sort((a: any, b: any) => {
      if (a.profile?.displayName < b.profile?.displayName) return -1;
      if (a.profile?.displayName > b.profile?.displayName) return 1;
      return 0;
    });
  } catch (error) {
    console.log("Helpers : sortAttendeesByUserName : " + error );  
  }

  console.log("Helpers : sortAttendeesByUserName : end " + JSON.stringify(attendees));
  return attendees;
}
