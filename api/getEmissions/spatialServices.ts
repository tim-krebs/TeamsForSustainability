import {
    Aborter,
    SearchURL,
    MapsURL,
    SpatialURL,
    SubscriptionKeyCredential,
    GetGreatCircleDistance
} from "azure-maps-rest";
import {
    Position
} from "geojson";

interface SpatialServices {
    searchURL : SearchURL;
    getCoordinates(location : string): Promise<Position>;
    getDistance(startCoordinates : Position, endCoordinates : Position): Promise<number>;
  }

  /**
   * 
    * Use Azure Maps module
    * https://www.npmjs.com/package/azure-maps-rest
    * 
   * https://docs.microsoft.com/en-us/javascript/api/azure-maps-rest/?view=azure-maps-typescript-latest
   */
class SpatialServices implements SpatialServices {
    searchURL : SearchURL;
    spatialURL : SpatialURL;

/**
 * https://docs.microsoft.com/en-us/azure/azure-maps/how-to-use-services-module
 */
constructor(){
    var subscriptionKey = 'qZcgaeq_AM_t8-xq3Ks5LYmvFIHYW4gky3Rv2lZhi7Y';
    var subscriptionKeyCredential = new SubscriptionKeyCredential(subscriptionKey);
    var pipeline = MapsURL.newPipeline(subscriptionKeyCredential, {
        retryOptions: { maxTries: 4 } // Retry options
    });
    this.searchURL = new SearchURL(pipeline);
    this.spatialURL = new SpatialURL(pipeline);
}

   /**
    * 
    * @param location 
    * @returns 
    * 
    * Get coordinates for both locations
    * https://docs.microsoft.com/en-us/rest/api/maps/search/get-search-address
    * GET https://atlas.microsoft.com/search/address/{format}?api-version=1.0&query={query}
    * 
    */
    public async getCoordinates(location : string) : Promise<Position> {
        let position :  Position = null;
        // Search for "1 microsoft way, redmond, wa".
        await this.searchURL.searchAddress(Aborter.timeout(10000), location)
            .then(response => {            
                let geometry = response.results[0];    
                position = [geometry.position.lat, geometry.position.lon];
            }).catch(error => {
                console.log(error);
            });
        return position;
    }

    /**
     * 
     * @param startPosition 
     * @param endPosition 
     * @returns distance
     * 
     *   Calculate distance between both locations
     *   https://docs.microsoft.com/en-us/rest/api/maps/spatial/get-great-circle-distance
     *   GET https://atlas.microsoft.com/spatial/greatCircleDistance/json?subscription-key={subscription-key}&api-version=1.0&query={query}
     */
    public async getDistance(startPosition : Position, endPosition : Position) : Promise<number> {
        let distanceKM : number = 0;
        await this.spatialURL.getGreatCircleDistance(Aborter.none, [startPosition,endPosition])
        .then(response => {                     
            let greatCircleDistance = response.rawResponse.parsedBody;
            distanceKM = greatCircleDistance.result.distanceInMeters / 1000;
        }).catch(error => {
            console.log(error);
        });
        return Math.floor(distanceKM);
    }
}
  
export { SpatialServices }; 