import { Attendee } from "./attendee";
import { Meeting } from "./meeting";
const { Connection, Request, TYPES } = require('tedious');

interface SqlQueries {
}
class SqlQueries implements SqlQueries {

    public static newMeetingQuery(meeting: Meeting) : string {   
        let query = 
            `BEGIN
                IF NOT EXISTS (SELECT OnlineMeetingID FROM dbo.Meetings WHERE OnlineMeetingID = '${meeting.id}')
                BEGIN
                    INSERT INTO dbo.Meetings (OnlineMeetingID, StartTime, EndTime, AttendeeCount, SavedEmission, City, PositionLat, PositionLon, OrganizerID, CalculationStatus) 
                    values (N'${meeting.id}','${meeting.start}','${meeting.end}','${meeting.attendees.length}','${meeting.emission}','${meeting.location}','${meeting.position[0]}','${meeting.position[1]}','${meeting.organizerId}','${meeting.calculationStatus}')
                END
            END`;
            query = query.replace(/(?:\r\n|\r|\n)/g, '');
        return query;
    }

    public static updateMeetingQuery(meeting: Meeting) : string {   
        let query = 
            `BEGIN
                BEGIN
                    UPDATE dbo.Meetings SET StartTime = '${meeting.start}', EndTime = '${meeting.end}', AttendeeCount = '${meeting.attendees.length}', SavedEmission = '${meeting.emission}', City = '${meeting.location}', PositionLat = '${meeting.position[0]}', PositionLon = '${meeting.position[1]}', OrganizerID = '${meeting.organizerId}', CalculationStatus = '${meeting.calculationStatus}' 
                    WHERE OnlineMeetingID = '${meeting.id}'
                END
            END`;
            query = query.replace(/(?:\r\n|\r|\n)/g, '');
        return query;
    }

    public static newAttendeeQuery(attendee: Attendee, meeting: Meeting) : string {  
        let query = 
        `BEGIN
            IF NOT EXISTS (SELECT * FROM dbo.Attendees WHERE OnlineMeetingID = '${meeting.id}' AND UserID = '${attendee.id}')
            BEGIN
                INSERT INTO dbo.Attendees (SavedEmission, Location, PositionLat, PositionLon, UserID, Username, TravelType, Distance, OnlineMeetingID, StartTime, IsOwner) 
                values (N'${attendee.emission}','${attendee.location}','${attendee.position[0]}','${attendee.position[1]}','${attendee.id}','${attendee.name}','${attendee.emissionType}','${attendee.distance}','${meeting.id}','${meeting.start}','${attendee.isOrganizer}')
            END
        END`;
            query = query.replace(/(?:\r\n|\r|\n)/g, '');
        return query;
    }

    public static updateAttendeeQuery(attendee: Attendee, meeting: Meeting) : string {  
        let query = 
        `BEGIN
            BEGIN
                UPDATE dbo.Attendees SET SavedEmission = '${attendee.emission}', Location = '${attendee.location}', PositionLat = '${attendee.position[0]}', PositionLon = '${attendee.position[1]}', Username = '${attendee.name}', TravelType = '${attendee.emissionType}', Distance = '${attendee.distance}', StartTime = '${meeting.start}', IsOwner = '${attendee.isOrganizer}' 
                WHERE OnlineMeetingID = '${meeting.id}' AND UserID = '${attendee.id}'
            END
        END`;
            query = query.replace(/(?:\r\n|\r|\n)/g, '');
        return query;
    }

    public static getAttendanceQuery(userId: string) : string {   
        let query = 
            `BEGIN
                SELECT * FROM dbo.Attendees WHERE UserID = '${userId}' AND IsOrganizer = 0
            END`;
            query = query.replace(/(?:\r\n|\r|\n)/g, '');
        return query;
    }

    public static getMeetingsQuery(userId: string) : string {   
        let query = 
            `BEGIN
                SELECT * FROM dbo.Meetings WHERE OrganizerID = '${userId}'
            END`;
            query = query.replace(/(?:\r\n|\r|\n)/g, '');
        return query;
    }   

    public static getMeetingQuery(meetingId: string) : string {   
        let query = 
            `BEGIN
                SELECT TOP 1 * FROM dbo.Meetings WHERE OnlineMeetingId = '${meetingId}'
            END`;
            query = query.replace(/(?:\r\n|\r|\n)/g, '');
        return query;
    }    

    public static getAttendeesQuery(meetingId: string) : string {   
        let query = 
            `BEGIN
                SELECT * FROM dbo.Attendees WHERE OnlineMeetingId = '${meetingId}'
            END`;
            query = query.replace(/(?:\r\n|\r|\n)/g, '');
        return query;
    } 
}
export { SqlQueries }; 