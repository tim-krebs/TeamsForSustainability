import React from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import { Grid, Text, Loader, Alert, Flex, Image, Card, CardHeader, CardBody, Divider } from "@fluentui/react-northstar";
import { ErrorIcon, MeetingTimeIcon, AttendeeIcon } from '@fluentui/react-icons-northstar'
import * as AzureFunctionAPI from "../services/AzureFunctionAPI";
import * as GraphAPI from "../services/GraphAPI";
import * as Helpers from "../services/Helpers";
import "./MyReportsPersonalTab.css";

class MyReportsPersonalTab extends React.Component<{}, any> {

  constructor(props: any) {
    super(props)

    this.state = {
      teamsContext: {}, // The Teams context
      currentUser: {}, // The current logedin user
      teamsTheme: "default",
      meetingsOrganized: [],
      sumSavedEmissionOrganizedMeetings: 0,
      sumSavedEmissionMeetingsAttended: 0,
      meetingsAttended: [],
      loading: false,
      loadingLabel: "Setting things up...",
      error: false,
      errorMessage: ""
    }
  }

  async componentDidMount() {

    // Initialize the Microsoft Teams SDK
    microsoftTeams.initialize();

    this.initContent()
  }

  /**
   * Load all the content of the page
   */
  async initContent() {

    this.setState({ loading: true });

    // Get the context from Teams and set it in the state
    microsoftTeams.getContext(async (context) => {
      try {

        let currentUser = await GraphAPI.getCurrentUser();
        if (!currentUser) {
          throw Error("Current user not found")
        }
        console.log("MyReportsPersonalTab : Current user : " + currentUser.profile.mail);

        this.setState({
          teamsContext: context,
          teamsTheme: context.theme,
          currentUser: currentUser,
          meetingsOrganized: [],
          sumSavedEmissionOrganizedMeetings: "",
          meetingsAttended: [],
          sumSavedEmissionMeetingsAttended: "",
          loading: false
        });

        AzureFunctionAPI.getOrganizedMeetings(currentUser.profile.mail).then(mo =>{
          console.log(mo);
          console.log("MyReportsPersonalTab : initContent : Count organized meetings = " + mo.meetings?.length);
          let sumSavedEmissionMo = Helpers.sumSavedEmission(mo.meetings);
          console.log("MyReportsPersonalTab : initContent : Sum saved emission of organized meetings = " + sumSavedEmissionMo);
  
          this.setState({
            teamsContext: context,
            teamsTheme: context.theme,
            currentUser: currentUser,
            meetingsOrganized: mo.meetings?.length ? mo.meetings : [],
            sumSavedEmissionOrganizedMeetings: sumSavedEmissionMo,
            loading: false
          });
        });

        await AzureFunctionAPI.getMeetingsAttended(currentUser.profile.mail).then(ma=>{
          console.log(ma);
          console.log("MyReportsPersonalTab : initContent : Count meetings attended = " + ma.attendance.length);
          let sumSavedEmissionMa = Helpers.sumSavedEmission(ma.attendance);
          console.log("MyReportsPersonalTab : initContent : Sum saved emission of meetings attended = " + sumSavedEmissionMa);
    
          this.setState({
            teamsContext: context,
            teamsTheme: context.theme,
            currentUser: currentUser,
            meetingsAttended: ma.attendance?.length ? ma.attendance : [],
            sumSavedEmissionMeetingsAttended: sumSavedEmissionMa,
            loading: false
          });
        });

      } catch (error) {
        console.log(error)
        if (error instanceof Error) {
          this.showError(error.message);
        } else {
          this.showError("Unkown error :-(");
        }
      }
    })
  }

  showError(errorMessage: string) {
    this.setState({
      loading: false,
      error: true,
      errorMessage: errorMessage
    })
  }

  render() {
    return (

      <Grid columns="2" >

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

        {this.state.loading &&
          <div style={{ gridColumn: 'span 2', gridRow: '1' }}>
            <Loader size="smaller" styles={{ zIndex: 10, marginLeft: 'auto', marginRight: 'auto' }} label={this.state.loadingLabel} />
          </div>
        }

        {!this.state.loading &&
          <>
            <Flex vAlign="center" space="between" style={{ gridColumn: 'span 2', gridRow: '2', padding: '20px', backgroundColor: 'lightgreen' }}>
              <Flex column>
                <Text size="largest" weight="semibold"
                  content={"Hi, " + this.state.currentUser?.profile?.displayName + "."}>
                </Text>
                <Text size="largest" weight="semibold"
                  content={"This is your personal sustainability statistic."}>
                </Text>
              </Flex>
              <Image src="logo.png" styles={{ width: '10%' }}>

              </Image>
            </Flex>

            <Flex gap="gap.medium" style={{ gridColumn: 'span 2', gridRow: '3' }} className="rowStyle">
              <Card elevated fluid>
                <CardHeader>
                  <Text size="larger" content={"Organized meetings"}>
                  </Text>
                </CardHeader>
                <CardBody>
                  <Flex column gap="gap.medium">
                    <Flex gap="gap.smaller" vAlign="center">
                      <Text size="medium"
                        content={"Look at your CO2 savings of your organized meetings"}>
                      </Text>
                      <Text size="large" weight="bold"
                        content={this.state.sumSavedEmissionOrganizedMeetings + "kg"}>
                      </Text>
                    </Flex>

                    <Flex gap="gap.small" >
                      <MeetingTimeIcon />
                      <Text size="medium"
                        content={"Number of meetings " + this.state.meetingsOrganized?.length}>
                      </Text>
                      <AttendeeIcon />
                      <Text size="medium"
                        content={"Number of attendes " + Helpers.sumAttendes(this.state.meetingsOrganized)}>
                      </Text>
                    </Flex>

                    <Flex column gap="gap.smaller">
                      <Divider
                        content={<Text size="large" content="Compare your savings to the real world"></Text>}>
                      </Divider>
                      <Text size="small"
                        content={"Savings of " + this.state.sumSavedEmissionOrganizedMeetings + "kg can compared to"}>
                      </Text>
                      <Text size="medium"
                        content={Helpers.savedDieselInLiter(this.state.sumSavedEmissionOrganizedMeetings) + "l Diesel"}>
                      </Text>
                      <Text size="medium"
                        content={Helpers.savedGasolineInLiter(this.state.sumSavedEmissionOrganizedMeetings) + "l Gasoline"}>
                      </Text>
                      <Text size="medium"
                        content={Helpers.savedMeetInKg(this.state.sumSavedEmissionOrganizedMeetings) + "kg Beaf Meet"}>
                      </Text>
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>

              <Card elevated fluid>
                <CardHeader>
                  <Text size="larger" content={"Attended meetings"}>
                  </Text>
                </CardHeader>
                <CardBody>
                  <Flex column gap="gap.medium">
                    <Flex gap="gap.smaller" vAlign="center">
                      <Text size="medium"
                        content={"Look at your CO2 savings of your attended meetings"}>
                      </Text>
                      <Text size="large" weight="bold"
                        content={this.state.sumSavedEmissionMeetingsAttended + "kg"}>
                      </Text>
                    </Flex>

                    <Flex gap="gap.small" >
                      <MeetingTimeIcon />
                      <Text size="medium"
                        content={"Number of meetings " + this.state.meetingsAttended?.length}>
                      </Text>
                    </Flex>

                    <Flex column gap="gap.smaller">
                      <Divider
                        content={<Text size="large" content="Compare your savings to the real world"></Text>}>
                      </Divider>
                      <Text size="small"
                        content={"Savings of " + this.state.sumSavedEmissionMeetingsAttended + "kg can compared to"}>
                      </Text>
                      <Text size="medium"
                        content={Helpers.savedDieselInLiter(this.state.sumSavedEmissionMeetingsAttended) + "l Diesel"}>
                      </Text>
                      <Text size="medium"
                        content={Helpers.savedGasolineInLiter(this.state.sumSavedEmissionMeetingsAttended) + "l Gasoline"}>
                      </Text>
                      <Text size="medium"
                        content={Helpers.savedMeetInKg(this.state.sumSavedEmissionMeetingsAttended) + "kg Beaf Meet"}>
                      </Text>
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            </Flex>


          </>
        }
      </Grid>
    );
  }
}
export default MyReportsPersonalTab;

