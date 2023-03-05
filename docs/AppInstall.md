Specification

1. Get onlineMeeting.joinUrl

Permissions: Calendars.Read, Calendars.ReadWrite
Documentation: https://docs.microsoft.com/en-us/graph/api/user-list-events

GET https://graph.microsoft.com/beta/me/events?$select=id,subject,start,location,isOnlineMeeting,onlineMeeting
{
    "@odata.etag": "W/\"cLVTlFMurUmHjqmZMiqXlgAHKqcHGA==\"",
    "id": "AAMkAGMzMzFiMzEyLTYyMmMtNDRmYS05NzI0LWU5MWNjZmE4ODhmNwBGAAAAAAAG4jlHIKdjTbhtIugUrtoYBwBwtVOUUy6tSYeOqZkyKpeWAAAAAAENAABwtVOUUy6tSYeOqZkyKpeWAAcUfA9OAAA=",
    "subject": "Test",
    "isOnlineMeeting": true,
    "start": {
        "dateTime": "2022-02-28T17:30:00.0000000",
        "timeZone": "UTC"
    },
    "location": {
        "displayName": "Munich, Germany",
        "locationType": "default",
        "uniqueId": "Munich, Germany",
        "uniqueIdType": "private"
    },
    "onlineMeeting": {
        "joinUrl": "https://teams.microsoft.com/l/meetup-join/19%3ameeting_NGNlYTA4ZmMtM2JlYS00YjdkLTgxNzQtMTM1NzlkOGI0ZWM4%40thread.v2/0?context=%7b%22Tid%22%3a%22d4a2ff9d-d46b-4616-8508-f7dfe6d3b433%22%2c%22Oid%22%3a%22f1e47cbe-3de1-4e49-9e91-e931ccbc6e39%22%7d"
    }
}

2. Get chatInfo.id

Permissions: OnlineMeetingArtifact.Read.All, OnlineMeetings.Read, OnlineMeetings.ReadWrite
Documentation: https://docs.microsoft.com/en-us/graph/api/onlinemeeting-get

GET https://graph.microsoft.com/beta/me/onlineMeetings?$filter=JoinWebUrl%20eq%20'https://teams.microsoft.com/l/meetup-join/19%3ameeting_NGNlYTA4ZmMtM2JlYS00YjdkLTgxNzQtMTM1NzlkOGI0ZWM4%40thread.v2/0?context=%7b%22Tid%22%3a%22d4a2ff9d-d46b-4616-8508-f7dfe6d3b433%22%2c%22Oid%22%3a%22f1e47cbe-3de1-4e49-9e91-e931ccbc6e39%22%7d'

"chatInfo": {
    "threadId": "19:meeting_ZjdjZDc1MmYtZmFiNy00NGQ5LThhNjktZjdiMTAzOTM1OGMy@thread.v2",
    "messageId": "0",
    "replyChainMessageId": null
}

3. Get AppId

Permissions: [ "AppCatalog.Submit", "AppCatalog.Read.All", "AppCatalog.ReadWrite.All", "Directory.Read.All**", "Directory.ReadWrite.All**" ]
Documentation: https://docs.microsoft.com/en-us/graph/api/appcatalogs-list-teamsapps

GET https://graph.microsoft.com/beta/appCatalogs/teamsApps?$filter=externalId eq '9102512a-4724-4b15-832d-ee9a5f29688e'

{
    "id": "f7e44b40-df43-48cd-9d41-e315d641e563",
    "externalId": "9102512a-4724-4b15-832d-ee9a5f29688e",
    "displayName": "TeamsForSustainability",
    "distributionMethod": "organization"
}

4. Add app to chat

Permissions: [ "TeamsAppInstallation.ReadWriteSelfForChat", "TeamsAppInstallation.ReadWriteForChat" ]
Documenation: https://docs.microsoft.com/en-us/graph/api/chat-post-installedapps

POST https://graph.microsoft.com/beta/chats/19:meeting_ZjdjZDc1MmYtZmFiNy00NGQ5LThhNjktZjdiMTAzOTM1OGMy@thread.v2/installedApps
{
   "teamsApp@odata.bind":"https://graph.microsoft.com/beta/appCatalogs/teamsApps/f7e44b40-df43-48cd-9d41-e315d641e563"
}
// f7e44b40-df43-48cd-9d41-e315d641e563

4. Add tab to chat

Permissions: [ "TeamsTab.Create", "TeamsTab.ReadWriteForChat", "TeamsTab.ReadWrite.All" ]
Documentation: https://docs.microsoft.com/en-us/graph/api/chat-post-tabs

POST https://graph.microsoft.com/beta/chats/19:meeting_ZjdjZDc1MmYtZmFiNy00NGQ5LThhNjktZjdiMTAzOTM1OGMy@thread.v2/tabs
{
  "displayName": "My Contoso Tab",
  "teamsApp@odata.bind" : "https://graph.microsoft.com/beta/appCatalogs/teamsApps/f7e44b40-df43-48cd-9d41-e315d641e563",
  "configuration": {
    "entityId": "TFS",
    "contentUrl": "https://localhost:53000/index.html#/tab",
    "websiteUrl": "https://localhost:53000/index.html#/tab"
  }
}