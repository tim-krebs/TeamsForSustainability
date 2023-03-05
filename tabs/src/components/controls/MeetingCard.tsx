import React from "react";
import { Card, Flex, Text, Button, Input, Accordion, Image, Label } from "@fluentui/react-northstar";
import * as GraphAPI from "../services/GraphAPI";
import { ChevronEndIcon, LocationIcon, EditIcon, AddIcon, MoreIcon } from '@fluentui/react-icons-northstar'
import * as Helpers from "../services/Helpers";

export interface IMeetingCardProps {
    meeting: any;
    meetingChangedHandler: any;
}

class MeetingCard extends React.Component<IMeetingCardProps, any> {

    constructor(props: any) {
        super(props)

        this.state = {
            isTFSAppInstalled: false,
            meetingLink: ""
        }
    }

    componentDidMount() {
        this.initContent();
    }


    async initContent() {
        console.log("MeetingCard : initContent");
        console.log(this.props.meeting);

        let installedApps = await GraphAPI.getInstalledMeetingApps(this.props.meeting?.onlineMeeting?.joinUrl)
        if (!installedApps) {
            console.log("MeetingCard : initContent : no installed apps found");
            return;
        }

        let conversationId = this.props.meeting?.onlineMeeting?.joinUrl.split('/')[5];
        let eventId = this.props.meeting?.id;
        let meetingLink = "https://teams.microsoft.com/_#/scheduling-form/?eventId=" + eventId + "&conversationId=" + conversationId + "2&opener=1&providerType=0&navCtx=event-card-click&calendarType=User"
        console.log("MeetingCard : initContent : meetingLink = " + meetingLink);

        let appInstalled = Helpers.isAppInstalled("TeamsForSustainability", installedApps);
        this.setState({
            isTFSAppInstalled: appInstalled,
            meetingLink: meetingLink
        })
    }

    componentDidUpdate(prevProps: IMeetingCardProps, prevState: any) {
        console.log("MeetingCard : componentDidUpdate")
    }

    private async updateMeeting() {
        console.log("MeetingCard : updateMeeting")
        await GraphAPI.updateMeeting(this.props.meeting);
        this.props.meetingChangedHandler();
    }

    private openMeetingTab() {
        window.open(this.state.meetingLink);
    }

    private async addApp() {
        console.log("MeetingCard : addApp on meeting " + this.props.meeting.subject)

        let addAppResult = await GraphAPI.addAppToMeeting(this.props.meeting.onlineMeeting.joinUrl);
        alert("Add App: " + addAppResult);
        this.props.meetingChangedHandler();
    }

    private onLocationChanged(event: any) {
        // show the user input value to console
        this.props.meeting.location.displayName = event.target.value;
        console.log("MeetingCard : onLocationChanged :" + this.props.meeting.location.displayName)
    }

    public render() {

        const panels = [
            {
                title: (
                    <Flex gap="gap.smaller" space="between">
                        <Text>{this.props.meeting?.subject}</Text>
                    </Flex>
                ),
                content: (
                    <Flex column>
                        <Flex gap="gap.smaller" key="animals">
                            <Input icon={<ChevronEndIcon />} iconPosition="start" label="Loction" onChange={this.onLocationChanged.bind(this)}
                                placeholder="City, Country"
                                defaultValue={this.props.meeting?.location?.displayName} />
                        </Flex>

                        <Flex space="between">
                            <Flex gap="gap.smaller" space="between">
                                <Button content="Update" onClick={this.updateMeeting.bind(this)} />
                                {!this.state.isTFSAppInstalled &&
                                    <Button primary content={
                                        <Flex vAlign="center">
                                            <Text content="Add app"></Text>
                                            <Image src="logo.png" title="This is sustainable meeting" styles={{ width: '15px', height: '15px', margin: '5px' }}></Image>
                                        </Flex>
                                    } onClick={this.addApp.bind(this)} />
                                }
                            </Flex>
                        </Flex>
                    </Flex>
                ),
            },
        ]

        return (
            <Card
                aria-roledescription="card avatar"
                elevated
                compact
                styles={{ height: "max-content", margin: "0.5em 0" }}
            >
                <Flex vAlign="start" space="between">
                    <Accordion panels={panels}></Accordion>

                    <Flex>
                        {
                            <EditIcon  styles={{ margin: '5px', cursor: 'pointer' }} onClick={this.openMeetingTab.bind(this)} />
                        }
                        {this.props.meeting?.location?.displayName &&
                            <LocationIcon styles={{ margin: '5px' }} title={this.props.meeting?.location?.displayName + " is set as meeting location"} />
                        }
                        {this.state.isTFSAppInstalled &&
                            <Image src="logo.png" title="This is sustainable meeting" styles={{ width: '15px', height: '15px', margin: '5px' }}></Image>
                        }
                    </Flex>
                </Flex>
            </Card>
        );
    }
}

export default MeetingCard;