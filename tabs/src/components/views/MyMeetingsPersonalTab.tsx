import React from "react";
import * as GraphAPI from "../services/GraphAPI";
import * as microsoftTeams from "@microsoft/teams-js";
import MeetingCard from "../controls/MeetingCard";
import { Grid, Segment, Header } from "@fluentui/react-northstar";
import MapControl from "../controls/MapControl";
import * as AzureMapsAPI from "../services/AzureMapsAPI";


class MyMeetingsPersonalTab extends React.Component<{}, any> {

  constructor(props: any) {
    super(props)

    this.state = {
      meetings: []
    }
  }

  async componentDidMount() {

    // Initialize the Microsoft Teams SDK
    microsoftTeams.initialize();

    this.initContent()
  }

  async initContent() {
    console.log("MyMeetingsPersonalTab : initContent");

    (async () => {

      let currentUser = await GraphAPI.getCurrentUser();
      if (!currentUser) {
        throw Error("Current user not found")
      }
      console.log("MyMeetingsPersonalTab : Current user : " + currentUser.profile.mail);

      let m = await GraphAPI.getOrganizedMeetings( currentUser.profile.mail );
      this.setState({ meetings: m });

      Promise.all(m.map(async (meeting: any, index: number) => {
        if (m[index].location.displayName) {
          AzureMapsAPI.GetLocation(meeting.location.displayName).then(location =>{
            m[index].location.lon = location.lon;
            m[index].location.lat = location.lat;
           
            console.log("MyMeetingsPersonalTab : initContent : meeting '"
              + m[index].subject +
              "' lat "
              + m[index].location.lon
              + " lon "
              + m[index].location.lat);
              
            this.setState({ meetings: m });
          });
          
        }
      })
      )

      console.log("MyMeetingsPersonalTab : initContent : after loop " + m[0].tfscoordinates)

      this.setState({ meetings: m });
    })()
  }

  async onMeetingChanged() {
    console.log("PersonalTab : onMeetingChanged");
    await this.initContent();
  }

  render() {
    return (
      <div style={{ width: '100%', padding: '10px' }}>

        <Grid styles={{
          gridTemplateColumns: '25% 75%',
          msGridColumns: ''
        }}>
          <Segment styles={{
            gridColumn: '1',
          }}>
            <Header>Organized meetings</Header>
            {this.state.meetings.map((m: any) => {
              return <MeetingCard meeting={m}
                meetingChangedHandler={this.onMeetingChanged.bind(this)} >
              </MeetingCard>
            })

            }
          </Segment>
          <Segment styles={{
            gridColumn: '2',
            maxHeight: '700px',
            minHeight: '700px',
          }}>
            <MapControl
              currentUser={""}
              attendees={[]}
              currentMeeting={""}
              meetings={this.state.meetings}></MapControl>
          </Segment>
        </Grid>
      </div>
    );
  }
}
export default MyMeetingsPersonalTab;

