import React from "react";
import { Button, Loader } from "@fluentui/react-northstar";
import { useData } from "./lib/useData";
import * as axios from "axios";
import { TeamsUserCredential, getResourceConfiguration, ResourceType } from "@microsoft/teamsfx";
import { url } from "inspector";

const functionName = "getMeetings/";

async function callProfile(){

}



async function callFunction() {
  try {
    //const meetingData = {
    //  "id":"123", 
    //  "title":"SCRUM Meeting", 
    //  "start": "2022-04-23T13:00:00.000Z",
    //  "end": "2022-04-23T14:00:00.000Z",
    //  "organizerId": "6b4b210a-e853-4a6f-8b59-6e78bfe57667",
    //  "location":"Munich, Germany",
    //  "attendees": [
    //    {"id":"3a32cab4-19c0-45d5-9c87-d3757635e79e", 
    //    "name":"Michael", 
    //    "location":"Stuttgart, Germany"},
    //    {"id":"9157093c-ec91-4478-a5e4-860384aaaae6", 
    //    "name":"Fangliang", 
    //    "location":"Köln, Germany"},
    //    {"id":"cd98e2b4-23cc-4fc0-9d2b-502c7dc579bb", 
    //    "name":"Melanie", 
    //    "location":"Hamburg, Germany"},
    //    {"id":"688f8131-18e9-48c8-9a00-242ecce3d4b6", 
    //    "name":"Ralph", 
    //    "location":"Leipzig, Germany"}
    //  ]
    //};
    const credential = new TeamsUserCredential();
    const accessToken = await credential.getToken("");
    const apiConfig = getResourceConfiguration(ResourceType.API);
    const response = await axios.default.get(apiConfig.endpoint + "/api/" + functionName, 
    {
      params: { userId: "" },
      headers: {
        authorization: "Bearer " + accessToken?.token || "",
      }
    });
    return response.data;
  } catch (err: unknown) {
    if (axios.default.isAxiosError(err)) {
      let funcErrorMsg = "";

      if (err?.response?.status === 404) {
        funcErrorMsg = `There may be a problem with the deployment of Azure Function App, please deploy Azure Function (Run command palette "Teams: Deploy to the cloud") first before running this App`;
      } else if (err.message === "Network Error") {
        funcErrorMsg =
          "Cannot call Azure Function due to network error, please check your network connection status and ";
        if (err.config?.url && err.config.url.indexOf("localhost") >= 0) {
          funcErrorMsg += `make sure to start Azure Function locally (Run "npm run start" command inside api folder from terminal) first before running this App`;
        } else {
          funcErrorMsg += `make sure to provision and deploy Azure Function (Run command palette "Teams: Provision in the cloud" and "Teams: Deploy to the cloud) first before running this App`;
        }
      } else {
        funcErrorMsg = err.message;
        if (err.response?.data?.error) {
          funcErrorMsg += ": " + err.response.data.error;
        }
      }

      throw new Error(funcErrorMsg);
    }
    throw err;
  }
}

export function AzureFunctions(props: { codePath?: string; docsUrl?: string }) {
  const { codePath, docsUrl } = {
    codePath: `api/${functionName}/index.ts`,
    docsUrl: "https://aka.ms/teamsfx-azure-functions",
    ...props,
  };
  const { loading, data, error, reload } = useData(callProfile, {
    auto: false,
  });
  return (
    <div>
      <h2>Call your Azure Function</h2>
      <p>An Azure Functions app is running. Authorize this app and click below to call it for a response:</p>
      <Button primary content="Call Azure Function" disabled={loading} onClick={reload} />
      {loading && (
        <pre className="fixed">
          {" "}
          <Loader />{" "}
        </pre>
      )}
      {!loading && !!data && !error && <pre className="fixed">{JSON.stringify(data, null, 2)}</pre>}
      {!loading && !data && !error && <pre className="fixed"></pre>}
      {!loading && !!error && <div className="error fixed">{error.toString()}</div>}
      <h4>How to edit the Azure Function</h4>
      <p>
        See the code in <code>{codePath}</code> to add your business logic.
      </p>
      {!!docsUrl && (
        <p>
          For more information, see the{" "}
          <a href={docsUrl} target="_blank" rel="noreferrer">
            docs
          </a>
          .
        </p>
      )}
    </div>
  );
}
