import React from "react";
import "./AttendeesWithoutLocationOverlay.css";
import { Text, Flex } from "@fluentui/react-northstar";
import { AttendeeInfo } from "./AttendeeInfo";

export function AttendeesWithoutLocationOverlay(props: {
   attendees?: any, 
   currentUser?: any,
   userChangedHandler?: any }) {

  return (
    <Flex column>
      <Text content="Attendees without location"></Text>
      <Flex styles={{minHeight:'50px', marginTop:'10px'}}>
        {
          props.attendees?.map((attendee: any) => {
            if( attendee.profile?.mail === props.currentUser?.profile?.mail)
            {
              return <AttendeeInfo key={attendee.profile?.mail} attendee={attendee} itsMe={true} userChangedHandler={props.userChangedHandler} ></AttendeeInfo>
            }else {
              return <AttendeeInfo key={attendee.profile?.mail} attendee={attendee} itsMe={false} userChangedHandler={props.userChangedHandler} ></AttendeeInfo>
            }
          })
        }
      </Flex>
    </Flex>
  )
};

