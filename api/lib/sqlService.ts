import { Meeting } from "./meeting";
import { SqlQueries } from "./sqlQueries";
const { Connection, Request, TYPES } = require('tedious');

interface SqlService {
    saveMeeting(meeting: Meeting) : void;
}
class SqlService implements SqlService {
    config : any;
    connection: any;
    static queries: string[];
    static index: number;

    constructor(){  
        this.config = {  
            server: 'teamsustainability.database.windows.net',  //update me
            authentication: {
                type: 'default',
                options: {
                    userName: 'teamsustainability', //update me
                    password: 'Tfs2022!'  //update me
                }
            },
            options: {
                // If you are on Microsoft Azure, you need encryption:
                encrypt: true,
                database: 'teamsustainability',  //update me
                trustServerCertificate: true
            }
        };  
    }

    public saveMeeting(meeting: Meeting) : void {

        SqlService.queries = [];
        SqlService.index = 0;
        var connection = new Connection(this.config);  

        connection.connect((err) => {        
            console.log("Connected");                   
            let meetingQuery = "";
            if(meeting.isUpdate){
                meetingQuery = SqlQueries.updateMeetingQuery(meeting);
            }
            else {
                meetingQuery = SqlQueries.newMeetingQuery(meeting);
            }
            SqlService.queries.push(meetingQuery);

            for (let attendee of meeting.attendees) {                                  
                let attendeeQuery = "";
                if(attendee.isUpdate){
                    attendeeQuery = SqlQueries.updateAttendeeQuery(attendee, meeting) 
                }
                else {
                    attendeeQuery = SqlQueries.newAttendeeQuery(attendee, meeting) 
                }
                SqlService.queries.push(attendeeQuery);
            }
            SqlService.executeQueries(0, connection);
        });
    }

    public static executeQueries(index: number, connection: any) : void {    
        var query = SqlService.queries[index];    
        const request = new Request(query, (err) => {
            if (err) {
                console.log("Error");  
            }
        });
        request.on('row', function(columns) {  
            columns.forEach(function(column) {  
              if (column.value === null) {  
                console.log('NULL');  
              } else {  
                console.log("Value " + column.value);  
              }  
            });  
        });
        request.on('done', function(rowCount, more) {
            console.log(rowCount + ' rows returned');
        });
        
        request.on('requestCompleted', function () {
            // Next SQL statement.
            console.log("Continue");  
            SqlService.index++;
            if(SqlService.queries.length > SqlService.index){
                SqlService.executeQueries(SqlService.index, connection);
            }
            else{
                connection.close();
            }
        });
        connection.execSql(request);
    }

    public async getMeeting(meetingId: string) : Promise<any> {
        return new Promise((resolve, reject) => {
            var connection = new Connection(this.config);  

            connection.connect((err) => {        
                console.log("Connected");                   
                
                let query = SqlQueries.getMeetingQuery(meetingId);
                this.executeQuery(query, connection)
                    .then(meeting => {resolve(meeting)});
            });
        });
    }
    public async getAttendees(meetingId: string) : Promise<any> {
        return new Promise((resolve, reject) => {
            var connection = new Connection(this.config);  

            connection.connect((err) => {        
                console.log("Connected");                   
                
                let query = SqlQueries.getAttendeesQuery(meetingId);
                this.executeQuery(query, connection)
                    .then(meeting => {resolve(meeting)});
            });
        });
    }

    // Async pattern with tedious
    // https://devblogs.microsoft.com/azure-sql/promises-node-tedious-azure-sql-oh-my/
    public async getMeetings(userId: string) : Promise<any> {
        return new Promise((resolve, reject) => {
            var connection = new Connection(this.config);  

            connection.connect((err) => {        
                console.log("Connected");                   
                
                let query = SqlQueries.getMeetingsQuery(userId);
                this.executeQuery(query, connection)
                    .then(meetings => {resolve(meetings)});
            });
        });
    }

    public async getAttendance(userId: string) : Promise<any> {
        return new Promise((resolve, reject) => {
            var connection = new Connection(this.config);  

            connection.connect((err) => {        
                console.log("Connected");                   
                
                let query = SqlQueries.getAttendanceQuery(userId);
                this.executeQuery(query, connection)
                    .then(attendance => {resolve(attendance)});
            });
        });
    }
    
    public executeQuery = (query: string, connection: any) => new Promise((resolve,reject) =>{
        
        var results = [];
        
        let request = new Request(query, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }     
        });    

        request.on('row', function(columns) {
            console.log('Retrieve Results');                 
            let item = {};
            columns.forEach(function(column) {    
            if (column.value === null) {  
                console.log('NULL');  
            } else {  
                console.log("Name " + column.metadata.colName);  
                console.log("Value " + column.value); 
                item[column.metadata.colName] = column.value;
            }
            });              
            results.push(item);
        });
        
        request.on('requestCompleted', function () {
            console.log("Continue");  
            connection.close();
        });
        connection.execSql(request);
    });
    
  public getMeetingJson(sqlData: any) : any {
    let meeting = {
        start: sqlData.StartTime,
        end: sqlData.EndTime,
        emission: sqlData.SavedEmission,
        location: sqlData.City,
        position: [sqlData.PositionLat, sqlData.PositionLon],
        id: sqlData.OnlineMeetingID,
        calculationStatus: sqlData.CalculationStatus,
        attendees: this.getAttendeeJson(sqlData.attendees)
    };
    return meeting;
  }
  public getAttendeeJson(sqlAttendees: []) : any {
    let attendees = [];
    sqlAttendees.forEach((sqlAttendee:any) => {
        let attendee = {
            emission: sqlAttendee.SavedEmission,
            location: sqlAttendee.Location,
            position: [sqlAttendee.PositionLat, sqlAttendee.PositionLon],
            id: sqlAttendee.UserID,
            emissionType: sqlAttendee.TravelType,
            distance: sqlAttendee.Distance,
          };
        attendees.push(attendee);
    });
    return attendees;
  }
}
export { SqlService }; 