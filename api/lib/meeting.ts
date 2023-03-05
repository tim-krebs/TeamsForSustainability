import { Attendee } from "./attendee";
import {
  Position
} from "geojson";

interface Meeting {
  id: string;
  chatId: string;
  title: string;
  location: string;
  attendees: Attendee[];
  position: Position;
  calculationStatus: string;
  start: Date;
  end: Date;
  organizerId: string;
  isUpdate: boolean;
  addEmission(value : number) : void;
}
   
class Meeting implements Meeting {
  id: string;
  chatId: string;
  title: string;
  location: string;
  attendees: Attendee[];
  position: Position;
  emission: number;
  calculationStatus: string;
  start: Date;
  end: Date;
  organizerId: string;
  isUpdate: boolean;

  constructor(meetingJson : any) {
    this.id = meetingJson.id;
    this.chatId = meetingJson.chatId;
    this.title = meetingJson.title;
    this.location = meetingJson.location;
    this.attendees = meetingJson.attendees;
    this.emission = 0;
    this.start = meetingJson.start;
    this.end = meetingJson.end;
    this.organizerId = meetingJson.organizerId;
    this.isUpdate = meetingJson.isUpdate;
  }

  public addEmission(value : number) : void {
    this.emission = this.emission + value;
  }
}
export { Meeting }; 