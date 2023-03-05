import React from "react";

import MapControl from "../controls/MapControl";
import * as GraphAPI from "../services/GraphAPI";
import * as AzureMapsAPI from "../services/AzureMapsAPI";
import * as microsoftTeams from "@microsoft/teams-js";
import * as AzureFunctionAPI from "../services/AzureFunctionAPI";
import * as Helpers from "../services/Helpers";
import { Popup, Flex, Segment, Loader, Button, Input, Grid, Dialog, Alert, Text, Tooltip } from "@fluentui/react-northstar";
import { SettingsIcon } from '@fluentui/react-icons-northstar'
import { ErrorIcon, ChevronEndIcon, LocationIcon, RetryIcon } from '@fluentui/react-icons-northstar'
import { AttendeeInfo } from "../controls/AttendeeInfo";

class MeetingDetailsTab extends React.Component<{}, any> {

  constructor(props: any) {
    super(props)

    this.state = {
      teamsContext: {}, // The Teams context
      teamsTheme: "default", // The current Teams theme
      currentUser: {}, // The current logedin user
      currentUserLocationString: "",
      attendees: [], // All attendees with a given location (AAD city, country)
      attendeesWithoutLocation: [], // All attendees with no location (AAD city, country)
      currentMeeting: {}, // The current meeting, determined by the given chat id
      currentMeetingLocation: "", // The temporay meeting location, if the location was not set while loading
      validMeetingLocation: false, // Flag to mark if the meeting location is valid
      emissionsCalculated: false, // Flag to mark if for the current meeting the emissions was calculated
      loading: false, // Falg to mark if the app is in loading state
      debug: false, // Toggels some debug info
      meetingHasLocation: true, // Flag to mark if the current meeting has a location while initial loading
      loadingLabel: "Setting things up...", // Loading message
      showLocationDialog: false,
      showLocationAlert: false,
      error: false,
      errorMessage: ""
    }
  }

  async componentDidMount() {

    // Initialize the Microsoft Teams SDK
    microsoftTeams.initialize();

    // Start loading the current meeting
    this.loadContent()
  }

  showError(errorMessage: string) {
    this.setState({
      loading: false,
      error: true,
      errorMessage: errorMessage
    })
  }

  /**
   * Do all the loading of the current meeting
  */
  async loadContent() {

    this.setState({ loading: true });

    // Get the context from Teams and set it in the state
    microsoftTeams.getContext(async (context) => {
      try {

        this.setState({
          teamsContext: context,
          teamsTheme: context.theme
        });

        microsoftTeams.registerOnThemeChangeHandler((theme: string) => {
          this.setState({ teamsTheme: theme })
        });

        console.log(context)

        // Get meeting by chat id
        let meeting = await GraphAPI.getMeeting(this.state.teamsContext.chatId);
        if (!meeting) {
          console.log("Tab : loadContent : no meeting found for chat id " + this.state.teamsContext.chatId);
        }
        console.log("Tab : loadContent : Found meeting = " + meeting.subject);

        // Check if a location is set on the current meeting
        if (meeting.location?.displayName === "") {
          console.log("MeetingDetailsTab : loadContent : No meeting location set");
          this.setState({
            loading: false,
            currentMeeting: meeting,
            meetingHasLocation: false
          })
          return;
        }

        // Get lat/lon from meeting location
        AzureMapsAPI.GetLocation(meeting.location?.displayName).then(meetingLocationData => {
          console.log("MeetingDetailsTab loadContent : Meeting location lat = " + meetingLocationData.lat + " lon = " + meetingLocationData.lon);
          meeting.location.lat = meetingLocationData.lat;
          meeting.location.lon = meetingLocationData.lon;

          this.setState({
            currentMeeting: meeting
          })
        });

        let currentUser = await GraphAPI.getCurrentUser();

        // Get all the attendees for the current meeting by chat id
        this.state.attendees.length = 0;
        this.state.attendeesWithoutLocation.length = 0;
        let chatAttendees = await GraphAPI.getChatAttendees(this.state.teamsContext.chatId);
        await Promise.all(chatAttendees.map(async (chatAttendee: any) => {

          // Load info from Graph
          let chatAttendeeInfo = await GraphAPI.getUserById(chatAttendee.userId);

          // Check if user have AAD city and country attribute set
          if (chatAttendeeInfo?.profile?.city && chatAttendeeInfo?.profile.country) {
            console.log("MeetingDetailsTab loadContent : try to get location for " + chatAttendeeInfo?.profile?.mail + " at " + chatAttendeeInfo?.profile?.city + ", " + chatAttendeeInfo?.profile.country);
            let longLatLocation = await AzureMapsAPI.GetLocation(chatAttendeeInfo?.profile?.city + ", " + chatAttendeeInfo?.profile.country);
            console.log("MeetingDetailsTab loadContent : " + chatAttendeeInfo?.profile?.mail + " profile = " + chatAttendeeInfo?.photoUrl + " location lat = " + longLatLocation.lat + " lon = " + longLatLocation.lon);
            chatAttendeeInfo.location = longLatLocation;
            this.state.attendees.push(chatAttendeeInfo);
          } else { // If no location is set, add the user to the list of attendees without location
            this.state.attendeesWithoutLocation.push(chatAttendeeInfo);
          }
        }));

        this.setState({
          attendees: Helpers.sortAttendeesByUserName(this.state.attendees),
          attendeesWithoutLocation: Helpers.sortAttendeesByUserName(this.state.attendeesWithoutLocation),
          currentUser: currentUser,
          currentUserLocationString: currentUser.profile?.city + ", " + currentUser.profile?.country,
          currentMeeting: meeting,
          loading: false,
          meetingHasLocation: true
        })

        // Start the calculation of the emissions for the current meeting
        this.calculateEmisson();

      } catch (error) {
        console.log(error)
        if (error instanceof Error) {
          this.showError(error.message);
        } else {
          this.showError("Unkown error :-(");
        }
      }
    });
  }

  onCurrentUserLocationChanged(event: any) {
    console.log("MeetingDeatilTab : onCurrentUserLocationChanged : " + event.target.value)
    this.setState({ currentUserLocationString: event.target.value })
  }

  async onCurrentUserLocationConfirm(event: any) {
    console.log("MeetingDeatilTab : onCurrentUserLocationChanged ")

    // TODO: add a more clever error handling
    try {
      let l = Helpers.getCityAndCountryFromString( this.state.currentUserLocationString)
      this.state.currentUser.profile.city = l?.city;
      this.state.currentUser.profile.country = l?.country;
      await this.updateAttendeeLocation(this.state.currentUser)

      this.setState({
        showLocationDialog: false,
        showLocationAlert: false
      })
    } catch (error) {
      this.setState({
        showLocationDialog: true,
        showLocationAlert: true
      })
    }
  }

  async updateAttendeeLocation(attendee: any) {
    console.log("MeetingDetailsTab : updateAttendeeLocation " + attendee.profile?.mail + " Location: " + attendee.profile?.city + ", " + attendee.profile?.country);

    if (!attendee || !attendee.profile?.city || !attendee?.profile.country) {
      console.log("MeetingDetailsTab : updateAttendeeLocation : No valide city or country given!");
      return;
    }

    // Get location from city and country
    let locationData = await AzureMapsAPI.GetLocation(attendee.profile?.city + ", " + attendee?.profile.country);
    if (!locationData) {
      console.log("MeetingDetailsTab : updateAttendeeLocation : Location can not be determined");
      return;
    }

    console.log("MeetingDetailsTab : updateAttendeeLocation : Current user location lat = " + locationData.lat + " lon = " + locationData.lon)
    attendee.location = locationData;

    // Update state
    this.setState({
      attendees:  Helpers.sortAttendeesByUserName(Helpers.addOrUpdateAttendeeFromAttendees(attendee, this.state.attendees)),
      attendeesWithoutLocation: Helpers.sortAttendeesByUserName(Helpers.removeAttendeeFromAttendees(attendee, this.state.attendeesWithoutLocation))
    })

    // Start recalucation of emissions
    this.calculateEmisson(true)
  }

  private onMeetingLocationChanged(event: any) {
    this.setState({ currentMeetingLocation: event.target.value });
    console.log("MeetingDetailsTab : onMeetingLocationChanged :" + this.state.currentMeetingLocation);

    // Check if we have a valide location (city, country)
    if (Helpers.validateLocation(event.target.value)) {
      this.setState({ validMeetingLocation: true })
    } else {
      this.setState({ validMeetingLocation: false })
    }
  }

  private async updateMeetingLocation(event: any) {
    console.log("MeetingDetailsTab : updateMeetingLocation :" + this.state.currentMeetingLocation);

    this.state.currentMeeting.location.displayName = this.state.currentMeetingLocation;
    await GraphAPI.updateMeeting(this.state.currentMeeting);

    this.loadContent();
  }

  // Calculate the emission for the current meeting
  // update : if true, the meeting and attendeea are updated, eg. if the user changed the location
  async calculateEmisson(update: boolean = false) {

    try {

      // Set loading state
      this.setState({
        loading: true,
        loadingLabel: "Calculation of CO2 savings..."
      })

      // Check if we have a meeting location
      if (!this.state.currentMeeting.location.lat || !this.state.currentMeeting.location.lon) {
        console.log("MeetingDetailsTab calculateEmisson : No lon/lat values for the meeting set");
        return;
      }

      // Create a new meeting date object from the meeting and attendees date
      let meetingData = Helpers.createMeetingForEmissionCalculation(
        this.state.currentMeeting,
        this.state.attendees,
        update
      )

      // Let's do the calculation
      let em = await AzureFunctionAPI.calculateMeetingEmissions(meetingData);
      if (!em) {
        console.log("MeetingDetailsTab calculateEmisson : No emissions !?");
        return;
      }

      // Add emission to attendees 
      this.state.attendees.forEach((a: any, index: number) => {
        this.state.attendees[index] = Helpers.addEmissionToAttendee(a, em);
      })

      // Add emssion to the meeting
      this.state.currentMeeting.calculatedEmmission = em;

      // Update
      this.setState({
        currentMeeting: this.state.currentMeeting,
        currentUser: Helpers.addEmissionToAttendee(this.state.currentUser, em),
        attendees: this.state.attendees,
        emissionsCalculated: true,
        loading: false
      })
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        this.showError(error.message);
      } else {
        this.showError("Unkown error :-(");
      }
    }
  }

  render() {
    return (
      <Grid columns="1" >

        {this.state.error &&
          <Alert
            icon={<ErrorIcon />}
            content={this.state.errorMessage}
            dismissAction="Transmit application"
            header="Ups, we have some trouble!"
            visible
            warning
          />
        }

        {this.state.meetingHasLocation && !this.state.error &&

          <Grid columns="90% 10%">
            <Flex vAlign="start" hAlign="start" styles={{ padding: '10px' }}>

              {this.state.loading &&
                <Loader size="smaller" styles={{ zIndex: 10, marginLeft: 'auto', marginRight: 'auto' }} label={this.state.loadingLabel} labelPosition="end" />
              }

            </Flex>

            <Flex gap="gap.medium" styles={{ padding: '10px' }}>
              <Dialog
                open={this.state.showLocationDialog}
                onOpen={() => this.setState({ showLocationDialog: true })}
                cancelButton="Cancel"
                confirmButton={"Confirm"}
                onConfirm={this.onCurrentUserLocationConfirm.bind(this)}
                onCancel={() => this.setState({ showLocationDialog: false })}

                content={<Flex column gap="gap.small">
                  {this.state.showLocationAlert &&
                    <Alert visible content="Please enter your location as follows 'City, Country'" />
                  }
                  <Text content="Please provide your current location" important />
                  <Flex vAlign="center" gap="gap.small">
                    <Text content="Location" />
                    <Input icon={<ChevronEndIcon />}
                      iconPosition="start"
                      placeholder="City, County"
                      defaultValue={this.state.currentUser?.profile?.city + ", " + this.state.currentUser?.profile?.country}
                      onChange={this.onCurrentUserLocationChanged.bind(this)}></Input>
                  </Flex>
                </Flex>}
                trigger={<Button circular icon={<LocationIcon />} disabled={this.state.loading}></Button>}
              >
              </Dialog>

              <Popup
                content="Here we will display the user settings"
                trigger={<Button circular icon={<SettingsIcon />} disabled={this.state.loading}></Button>}
              >
              </Popup>

              <Tooltip content="Reload" trigger={
                <Button
                  circular
                  icon={<RetryIcon />}
                  onClick={this.loadContent.bind(this)}
                  disabled={this.state.loading}>
                </Button>} />

            </Flex>

          </Grid>
        }

        {!this.state.loading && !this.state.error && !this.state.meetingHasLocation &&

          <Flex space="between" vAlign="start" hAlign="end" styles={{ padding: '10px' }}>
            <Flex gap="gap.smaller" >
              <Input icon={<ChevronEndIcon />}
                iconPosition="start"
                label="Ups, please provide a location for this meeeting"
                onChange={this.onMeetingLocationChanged.bind(this)}
                placeholder="City, Country" />
              <Button content="Update meeting location"
                disabled={!this.state.validMeetingLocation}
                onClick={this.updateMeetingLocation.bind(this)}>
              </Button>
            </Flex>
            <Popup
              content="Here we will display the user settings"
              trigger={<Button circular icon={<SettingsIcon />} ></Button>}
            >
            </Popup>

          </Flex>
        }

        <Segment styles={{ minHeight: '700px', padding: '0px' }}>
          <Grid styles={{
            gridTemplateColumns: '15% 85%',
            msGridColumns: ''
          }}>
            <Segment styles={{
              gridColumn: '1',
            }}>
              <Flex gap="gap.medium" styles={{ marginTop: '0px' }} column>

                <Flex column>
                  <Text size="medium" important>Attendees</Text>
                  <Flex gap="gap.small" column>
                    {this.state.attendees.map((a: any) => {
                      return <AttendeeInfo
                        attendee={a}
                        itsMe={a.profile?.mail === this.state.currentUser?.profile?.mail}
                        userChangedHandler={this.updateAttendeeLocation.bind(this)}></AttendeeInfo>
                    })
                    }
                  </Flex>
                </Flex>

                {this.state.attendeesWithoutLocation.length > 0 &&
                  <Flex column>
                    <Text size="medium" important>Attendees without location</Text>
                    <Flex gap="gap.small" column>
                      {this.state.attendeesWithoutLocation.map((a: any) => {
                        return <AttendeeInfo
                          attendee={a}
                          itsMe={a.profile?.mail === this.state.currentUser?.profile?.mail}
                          userChangedHandler={this.updateAttendeeLocation.bind(this)}></AttendeeInfo>
                      })}
                    </Flex>
                  </Flex>
                }

              </Flex>

            </Segment>
            <Segment styles={{
              gridColumn: '2',
              maxHeight: '700px',
              minHeight: '700px',
            }}>

              < MapControl
                currentUser={this.state.currentUser}
                attendees={this.state.attendees}
                currentMeeting={this.state.currentMeeting}
                meetings={[]}
                drawTravelLines={this.state.emissionsCalculated}
                theme={this.state.teamsTheme}>
              </MapControl>
            </Segment>
          </Grid>
        </Segment>

      </Grid>
    );
  }
}
export default MeetingDetailsTab;

