import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import "./MapControl.css";
import { MapAttendeeMarker } from "./MapAttendeeMarker";
import { MapAttendeeMarkerPopup } from "./MapAttendeeMarkerPopup";
import { MapMeetingMarker } from "./MapMeetingMarker";
import { MapMeetingMarkerPopup } from "./MapMeetingMarkerPopup";
import {
  AzureMap,
  AzureMapDataSourceProvider,
  AzureMapLayerProvider,
  AzureMapsProvider,
  ControlOptions,
  IAzureMapControls,
  IAzureMapOptions
} from 'react-azure-maps';
import { AuthenticationType, addImageTemplate, getAllImageTemplateNames, math, data, HtmlMarker, Popup } from 'azure-maps-control';
import { Alert } from "@fluentui/react-northstar";
import { InfoIcon } from '@fluentui/react-icons-northstar'

export interface IMapControlProps {
  currentUser: any;
  attendees: Array<any>;
  currentMeeting: any;
  meetings: Array<any>;
  drawTravelLines: false;
  theme: "default"
}

/**
 * MapControl component, responsible for all the map rendering
 */
class MapControl extends React.Component<any, IMapControlProps> {

  private planeTemplate: string = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="calc(80px * {scale})" height="calc(80px * {scale})"><rect x="0" y="0" width="80" height="80" fill="{secondaryColor}"/><path fill="{color}" d="M14 16H9v-2h5V9.87a4 4 0 1 1 2 0V14h5v2h-5v15.95A10 10 0 0 0 23.66 27l-3.46-2 8.2-2.2-2.9 5a12 12 0 0 1-21 0l-2.89-5 8.2 2.2-3.47 2A10 10 0 0 0 14 31.95V16zm40 40h-5v-2h5v-4.13a4 4 0 1 1 2 0V54h5v2h-5v15.95A10 10 0 0 0 63.66 67l-3.47-2 8.2-2.2-2.88 5a12 12 0 0 1-21.02 0l-2.88-5 8.2 2.2-3.47 2A10 10 0 0 0 54 71.95V56zm-39 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm40-40a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM15 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm40 40a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path></svg>';
  private map: any;
  private meetingMarker: HtmlMarker | undefined;
  private attendeesMarker: Array<HtmlMarker> = [];
  private meetingsMarker: Array<HtmlMarker> = [];

  private option: IAzureMapOptions = {
    authOptions: {
      authType: AuthenticationType.subscriptionKey,
      subscriptionKey: 'qZcgaeq_AM_t8-xq3Ks5LYmvFIHYW4gky3Rv2lZhi7Y', // TODO hide this somehow
    },
    center: [9.680845, 50.555809], // Long, Lat
    zoom: 5, // 1 = zoom out | 25 = zoom in
    view: 'Auto',
    style: 'grayscale_light'
  };

  private controls: IAzureMapControls[] = [
    {
      controlName: 'StyleControl',
      controlOptions: { mapStyles: ['grayscale_light', 'grayscale_dark'] },
      options: { position: 'top-right' } as ControlOptions,
    },
    {
      controlName: 'ZoomControl',
      options: { position: 'top-right' } as ControlOptions,
    }
  ];

  componentDidMount() {

  }

  componentDidUpdate(prevProps: IMapControlProps, prevState: any) {
    this.refresh();
  }

  refresh() {
    if (this.map) {

      // TODO make this update logic more clever
      this.map.markers.clear();
      this.meetingMarker = undefined;
      this.attendeesMarker = [];
      this.meetingsMarker = [];

      this.addOrUpdateCurrentMeeting();
      this.addOrUpdateAttendees();
      this.addOrUpdateMeetings();
      this.addTravelLines();
      this.updateTheme();

    }
  }

  private mapReady(e: any): void {
    this.map = e.map;

    try {
      addImageTemplate('plane', this.planeTemplate, true);
      console.log(getAllImageTemplateNames());
      this.map.imageSprite.createFromTemplate('car', 'car', 'DarkGreen', '#fff');
      this.map.imageSprite.createFromTemplate('plane', 'triangle-arrow-up', 'DarkGreen', '#fff');
    } catch (error) {
      console.log(error);
    }
  }

  private dataSourceProviderReady(e: any): void {
    console.log("MapControl : dataSourceProviderReady")
    this.refresh();
  }

  private updateTheme() {

    console.log("MapControl : updateTheme : " + this.props.theme)
    if (this.map) {

      switch (this.props.theme) {
        case "default":
          console.log("MapControl : updateTheme : to 'grayscale_light'");
          this.map.setStyle({ style: 'grayscale_light' });
          break;

        default:
          console.log("MapControl : updateTheme : to 'grayscale_dark'");
          this.map.setStyle({ style: 'grayscale_dark' });
          break;
      }
    }
  }

  private addOrUpdateAttendees() {

    try {
      console.log("MapControl : addOrUpdateAttendees")

      this.props.attendees.forEach((a: any) => {

        let markerHtmlString = "";
        let markerHtmlPopup = "";

        // Check if the attendee is the current user, then will display a different style
        let itsMe = a.profile?.mail === this.props.currentUser?.profile?.mail;
        markerHtmlString = ReactDOMServer.renderToString(MapAttendeeMarker(a, itsMe));
        markerHtmlPopup = ReactDOMServer.renderToString(MapAttendeeMarkerPopup(a, itsMe));

        //Create an HTML marker and add it to the map.
        let marker = new HtmlMarker({
          color: 'DodgerBlue',
          position: [a?.location?.lon, a?.location?.lat],
          htmlContent: markerHtmlString,
          pixelOffset: [0, 10],
          popup: new Popup({
            fillColor: '#f5f5f5',
            content: markerHtmlPopup,
            pixelOffset: [0, -20],
            opacity: 0.90
          })
        });


        //Add a click event to toggle the popup.
        this.map.events.add('click', marker, () => {
          marker.togglePopup();
        });
        

        this.attendeesMarker.push(marker);          
      });

      this.map.markers.add(this.attendeesMarker);

    } catch (error) {

    }
  }

  private addOrUpdateCurrentMeeting() {

    try {
      console.log("MapControl : addOrUpdateCurrentMeeting")
      const markerHtmlString = ReactDOMServer.renderToString(MapMeetingMarker(this.props.currentMeeting));
      const markerHtmlPopup = ReactDOMServer.renderToString(MapMeetingMarkerPopup(this.props.currentMeeting));

      //Create an HTML marker and add it to the map.
      this.meetingMarker = new HtmlMarker({
        color: 'DodgerBlue',
        position: [this.props.currentMeeting?.location?.lon, this.props.currentMeeting?.location?.lat],
        htmlContent: markerHtmlString,
        pixelOffset: [85, 0],
        popup: new Popup({
          fillColor: '#f5f5f5',
          content: markerHtmlPopup,
          pixelOffset: [0, -20]
        })
      });

      //Add a click event to toggle the popup.
      this.map.events.add('click', this.meetingMarker, () => {
        this.meetingMarker?.togglePopup();
      });

      this.map.markers.add(this.meetingMarker);
    } catch (error) {

    }
  }

  private addOrUpdateMeetings() {

    this.meetingsMarker = [];
    try {
      console.log("MapControl : addOrUpdateMeetings")

      this.props.meetings.forEach((meeting: any) => {

        if (!meeting?.location?.lat && !meeting?.location?.lon) {
          return;
        }
        const markerHtmlString = ReactDOMServer.renderToString(MapMeetingMarker(meeting));
        const markerHtmlPopup = ReactDOMServer.renderToString(MapMeetingMarkerPopup(meeting));


        //Create an HTML marker and add it to the map.
        let marker = new HtmlMarker({
          color: 'DodgerBlue',
          position: [meeting?.location?.lon, meeting?.location?.lat],
          htmlContent: markerHtmlString,
          pixelOffset: [85, 0],
          popup: new Popup({
            fillColor: '#f5f5f5',
            content: markerHtmlPopup,
            pixelOffset: [0, -20]
          })
        });

        this.map.events.add('click', marker, () => {
          marker?.togglePopup();
        });

        this.meetingsMarker.push(marker)
      });

      this.map.markers.add(this.meetingsMarker);

    } catch (error) {
      console.log("MapControl : addOrUpdateMeetingsLocation : ERROR")

    }

  }

  private addTravelLines() {
    console.log("MapControl : addTravelLines")

    try {

      if (this.props.attendees?.length > 0 && this.props.currentMeeting?.location) {

        let airTravelDataSource = this.map.sources.getById("TravelLines AirTravel DataSourceProvider");
        airTravelDataSource.clear();
        let roadTravelDataSource = this.map.sources.getById("TravelLines RoadTravel DataSourceProvider");
        roadTravelDataSource.clear();
        let otherTravelDataSource = this.map.sources.getById("TravelLines OtherTravel DataSourceProvider");
        otherTravelDataSource.clear();

        this.props.attendees.forEach((a: any) => {

          if (!a.emission) {
            return;
          }

          let postions = math.getPositionsAlongPath([
            [a?.location?.lon, a?.location?.lat],
            [this.props.currentMeeting?.location?.lon, this.props.currentMeeting?.location?.lat]]
            , 20);

          let spline = math.getCardinalSpline(postions)

          if (a.emissionType === "Air Travel") {
            airTravelDataSource.add(new data.LineString(spline));
          }
          else if (a.emissionType === "Road Travel") {
            roadTravelDataSource.add(new data.LineString(spline));
          }
          else {
            otherTravelDataSource.add(new data.LineString(spline));
          }
        })
      }
    } catch (error) {
      console.log("MapControl : addTravelLines : ERROR")
    }
  }

  public render() {
    return (
      <AzureMapsProvider>
        <AzureMap
          options={this.option}
          controls={this.controls}
          events={{ ready: this.mapReady.bind(this) }}
        >
          {this.props.currentMeeting.calculatedEmmission?.meetingEmmission?.emission && (
            <Alert
              icon={<InfoIcon />}
              content={"With this virtual meeting " + this.props.currentMeeting.calculatedEmmission?.meetingEmmission?.emission + "kg CO2 are saved"}
              dismissAction="Transmit application"
              header="Congratulations"
              visible success
              style={{ marginTop: '10px', marginLeft: '50px', marginRight: '50px', }}
            />
          )
          }
         
          <AzureMapDataSourceProvider
            events={{ ready: this.dataSourceProviderReady.bind(this) }}
            id={'TravelLines AirTravel DataSourceProvider'} options={{
              cluster: false,
              clusterRadius: 50,
              clusterMaxZoom: 10
            }}>
            <AzureMapLayerProvider
              id={'TravelLines AirTravel LineLayer'}
              type="LineLayer"
              options={{
                opacity: 0.5,
                strokeColor: "#76aa64",
                visible: this.props.drawTravelLines,
                blur: 0.5,
                strokeOpacity: 0.7,
                strokeWidth: 2.5
              }}
            ></AzureMapLayerProvider>
            <AzureMapLayerProvider
              id={'TravelLines AirTravel SymbolLayer'}
              type="SymbolLayer"
              options={{
                lineSpacing: 100,
                visible: this.props.drawTravelLines,
                placement: "line",
                iconOptions: {
                  image: 'plane',
                  allowOverlap: true,
                  anchor: 'center',
                  size: 0.7,
                  rotation: 90
                }
              }}
            ></AzureMapLayerProvider>
          </AzureMapDataSourceProvider>
          <AzureMapDataSourceProvider
            events={{ ready: this.dataSourceProviderReady.bind(this) }}
            id={'TravelLines RoadTravel DataSourceProvider'} options={{
              cluster: false,
              clusterRadius: 50,
              clusterMaxZoom: 10
            }}>
            <AzureMapLayerProvider
              id={'TravelLines RoadTravel LineLayer'}
              type="LineLayer"
              options={{
                opacity: 0.5,
                strokeColor: "#76aa64",
                visible: this.props.drawTravelLines,
                blur: 0.5,
                strokeOpacity: 0.7,
                strokeWidth: 2.5
              }}
            ></AzureMapLayerProvider>
            <AzureMapLayerProvider
              id={'TravelLines RoadTravel SymbolLayer'}
              type="SymbolLayer"
              options={{
                lineSpacing: 50,
                visible: this.props.drawTravelLines,
                placement: "line",
                iconOptions: {
                  image: 'car',
                  allowOverlap: true,
                  anchor: 'center',
                  size: 0.5,
                  rotation: 90
                }
              }}
            ></AzureMapLayerProvider>
          </AzureMapDataSourceProvider>
          <AzureMapDataSourceProvider
            events={{ ready: this.dataSourceProviderReady.bind(this) }}
            id={'TravelLines OtherTravel DataSourceProvider'} options={{
              cluster: false,
              clusterRadius: 50,
              clusterMaxZoom: 10
            }}>
            <AzureMapLayerProvider
              id={'TravelLines OtherTravel LineLayer'}
              type="LineLayer"
              options={{
                opacity: 0.5,
                strokeColor: "#76aa64",
                visible: this.props.drawTravelLines,
                blur: 0.5,
                strokeOpacity: 0.7,
                strokeWidth: 2.5
              }}
            ></AzureMapLayerProvider>
          </AzureMapDataSourceProvider>
        </AzureMap>

      </AzureMapsProvider>

    );
  }
}
export default MapControl;
