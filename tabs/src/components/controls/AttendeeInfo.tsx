import React, { useState } from "react";
import { Alert, Text, Popup, Input, Flex, Dialog } from "@fluentui/react-northstar";
import { ChevronEndIcon } from '@fluentui/react-icons-northstar'
import "./AttendeeInfo.css";

export function AttendeeInfo(props: {
  attendee?: any,
  itsMe: boolean,
  userChangedHandler?: any
}) {

  const [location, setLocations] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  function onLocationChanged(event: any) {
    setLocations(event.target.value)
  }

  function onConfirm() {

    console.log("UserInfo : onConfirm")

    // TODO: add a more clever error handling
    try {
      let l = location.split(',')
      props.attendee.profile.city = l[0].trim();
      props.attendee.profile.country = l[1].trim();
      props.userChangedHandler(props.attendee)
      setShowDialog(false);
    } catch (error) {
      setShowAlert(true);
      setShowDialog(true);
    }
  }

  return (
    <div>
      {props.attendee && !props.itsMe && (
        <Popup
          content={
            <Flex column gap="gap.small">
              <Text content={props.attendee?.profile?.displayName} important />
              <Text content={props.attendee?.profile?.mail} />
            </Flex>
          }
          trigger={
            <Flex gap="gap.medium">
              <img title={props.attendee.profile.displayName}
                src={props.attendee.photoUrl}
                className="attendeeInfo" />
              <Flex column vAlign="start">
                <Text content={props.attendee?.profile?.displayName} important />
                {props.attendee?.profile?.city && props.attendee?.profile?.country &&
                  <Text content={props.attendee?.profile?.city + ", " + props.attendee?.profile?.country} />
                }
              </Flex>
            </Flex>
          }
        >
        </Popup>
      )}

      {props.attendee && props.itsMe && (
        <Dialog
          open={showDialog}
          onOpen={() => setShowDialog(true)}
          cancelButton="Cancel"
          confirmButton={"Confirm"}
          onConfirm={onConfirm}
          onCancel={() => setShowDialog(false)}

          content={
            <Flex column gap="gap.small">
              {showAlert &&
                <Alert visible content="Please enter your location as follows 'City, Country'" />
              }
              <Text content={props.attendee?.profile?.displayName} important />
              <Text content={props.attendee?.profile?.mail} />
              <Flex vAlign="center" gap="gap.small">
                <Text content="Location" />
                <Input icon={<ChevronEndIcon />} 
                iconPosition="start" 
                placeholder="City, County"
                defaultValue={props.attendee?.profile?.city + ", " + props.attendee?.profile?.country}                     
                onChange={onLocationChanged}></Input>
              </Flex>
            </Flex>
          }
          trigger={
            
            <Flex gap="gap.medium">
              <img title={props.attendee.profile.displayName}
                src={props.attendee.photoUrl}
                className="attendeeInfo pulse" />
              <Flex column vAlign="start">
                <Text content={props.attendee?.profile?.displayName} important />
                {props.attendee?.profile?.city && props.attendee?.profile?.country &&
                  <Text content={props.attendee?.profile?.city + ", " + props.attendee?.profile?.country} />
                }
              </Flex>
            </Flex>
          }
        >
        </Dialog>
      )}
    </div>
  )
};
