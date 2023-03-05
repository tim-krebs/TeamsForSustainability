import axios from "axios";  

interface EmissionCalculator {
    apiKey : string;
    getSavedEmission(startLocation : string, endLocation : string): number;
  }
/*  
  3. Calculate emission based on distance
  https://docs.climatiq.io/#road-travel

*/   
class EmissionCalculator implements EmissionCalculator {
    
    static apiKey : string = "MM0Y9NTEANM9KPJERC09NAY7KJ7T";
    static kmThreshold : number = 500;

    /**
     * International air travel for economy, including RF
     * Returns emissions in kilogram
     * https://explorer.climatiq.io/?category=Air+Travel&region=GLOBAL&year=2021&unit_type=PassengerOverDistance 
     * @param distance 
     * @returns emissions
     */
    static async getSavedEmission(distance : number): Promise<number> {
        let emission : number = 0;
        let emission_factor = "";
        if(distance < this.kmThreshold){
            emission_factor = "passenger_vehicle-vehicle_type_black_cab-fuel_source_na-distance_na-engine_size_na"
        }else{
            emission_factor = "passenger_flight-route_type_outside_uk-aircraft_type_na-distance_na-class_economy-rf_included"
        }
        emission = await this.calculateEmission(distance, emission_factor);
        return emission;
    }

    static async calculateEmission(distance: number, emission_factor: string) : Promise<number> {
        const reqBody = {
            "emission_factor": emission_factor,
            "parameters": {
                "distance": distance,
                "distance_unit": "km"
            }
        }
        let emissionKG : number = 0;
        await axios.post('https://beta3.api.climatiq.io/estimate', reqBody,
        {
          headers: {
            authorization: "Bearer " + this.apiKey,
          }
        }).then(response => {
            emissionKG = response.data.co2e;
        }).catch(error => {
            console.log(error);
        });
        return Math.floor(emissionKG);
    }

    static getEmissionType(distance: number) : string {
        let emissionType : string = "Road Travel"
        if(distance >= EmissionCalculator.kmThreshold){
            emissionType = "Air Travel";
        }
        return emissionType;
    }
    
}
export { EmissionCalculator }; 