export const MapAttendeeMarkerPopup = (attendee: any, itsMe: boolean = false) => (
  
  <div style={{ margin: '5px', color: 'black' }}>
    <p><strong>{attendee?.profile.displayName}</strong></p>
    <span><a href={'mailto:' + attendee?.profile.mail}> {attendee?.profile.mail} </a> </span><br></br>
    <span>Location: {attendee?.profile.city}, {attendee?.profile.country}</span><br></br>
  
    {attendee?.emission !== undefined && attendee?.emission !== 0 && (
      <>
        <span>Distance to meeting: {attendee?.distance} km</span><br></br>
        <span>Emission: {attendee?.emission} kg</span><br></br>
        <span>Emission type: {attendee?.emissionType}</span><br></br>
      </>
    )}
  </div>

);
