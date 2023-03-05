Replace the auto-generated teamsAppId in localSettings.json with this:
"teamsAppId": "587852f8-20dc-409c-bc64-9dbb58a45f93"

In the Azure App Registration:
- Add Delegated API Permission: OnlineMeetingArtifact.Read.All
- Consent as adminstrator

Azure Maps Account with Pricing Tier S1 or higher is required

App needs to be published so that "Add App" Button works

Update azure.parameters.{env}.json
- BaseResourceName: teamsustainability

Install MSSQL Extension
https://docs.microsoft.com/en-us/sql/tools/visual-studio-code/sql-server-develop-use-vscode?view=sql-server-ver15

Run sql scripts to create tables in the database 

SQL Admin
userName: 'teamsustainability',
password: 'Tfs2022Tfs2022Tfs2022'