import React from "react";
// https://fluentsite.z22.web.core.windows.net/quick-start
import { Provider, teamsTheme, Loader } from "@fluentui/react-northstar";
import { HashRouter as Router, Redirect, Route } from "react-router-dom";
import { useTeamsFx } from "./lib/useTeamsFx";
import Privacy from "./Privacy";
import TermsOfUse from "./TermsOfUse";
import MeetingDetailsTab from "./views/MeetingDetailsTab";
import "./App.css";
import TabConfig from "./TabConfig";
import MyMeetingsPersonalTab from "./views/MyMeetingsPersonalTab";
import MyReportsPersonalTab from "./views/MyReportsPersonalTab";
import { AzureFunctions } from "./AzureFunctions"

/**
 * The main app which handles the initialization and routing
 * of the app.
 */
export default function App() {
  
  const { theme, loading } = useTeamsFx();
  return (
    <Provider theme={theme || teamsTheme} >
      <Router>
        <Route exact path="/">
          <Redirect to="/tab" />
        </Route>
        {loading ? (
          <Loader style={{ margin: 100 }} />
        ) : (
          <>
            <Route exact path="/mymeetingspersonaltab" component={MyMeetingsPersonalTab} />
            <Route exact path="/myreportspersonaltab" component={MyReportsPersonalTab} />
            <Route exact path="/azfunctiontest" component={AzureFunctions} />
            <Route exact path="/privacy" component={Privacy} />
            <Route exact path="/termsofuse" component={TermsOfUse} />
            <Route exact path="/tab" component={MeetingDetailsTab} />
            <Route exact path="/config" component={TabConfig} />
          </>
        )}
      </Router>
    </Provider>
  );
}