
/**
 * Query the Azure Maps API for the givern query and return
 * @param query The query string
 * @returns The position object, with lat and lon
 */
export async function GetLocation( query: string) {

  if( !query ) {
    return;
  }

  // TODO hide this key
  const suscriptionKey = "qZcgaeq_AM_t8-xq3Ks5LYmvFIHYW4gky3Rv2lZhi7Y";
  
  let url = "https://atlas.microsoft.com/search/address/json?subscription-key="+suscriptionKey+"&api-version=1.0&query=";
  let urlQuery = url + query;

  console.log ("AzureMapsAPI : GetLocation : query " + urlQuery )
  try {
    return fetch(urlQuery)
      .then((res) => {
        return res.json();
      }).then((data) => {
        if( data.error) {        
          throw Error( "Azure Maps: " + data.error.message );         
        }
        console.log("AzureMapsAPI : GetLocation : lat " + data.results[0].position.lat + " lon " + data.results[0].position.lon )
        return data.results[0].position;
      })

  } catch (error) {
    console.log ("AzureMapsAPI : GetLocation : " + error);
    throw error;
  }
}