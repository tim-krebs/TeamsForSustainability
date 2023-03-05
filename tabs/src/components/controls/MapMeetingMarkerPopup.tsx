export const MapMeetingMarkerPopup = ( meeting: any) => (
  <div style={{margin:'5px', color:'black'}}>
     <p><strong>{meeting?.subject}</strong></p>   
     <p>{meeting?.location?.displayName}</p>     
  </div>  
);
