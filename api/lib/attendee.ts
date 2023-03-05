import {
  Position
} from "geojson";
interface Attendee {
    id: string;
    name: string;
    location: string;
    position: Position;
    distance: number;
    calculationStatus: string;
    emissionType: string;
    isUpdate: boolean;
    isOrganizer: number;
  }
   
class Attendee implements Attendee {
    id: string;
    name: string;
    location: string;
    position: Position;
    distance: number;
    calculationStatus: string;
    emissionType: string;
    isUpdate: boolean;
    isOrganizer: number;
    _emission: number;

    constructor(id: string, name: string, location: string) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.calculationStatus = "";
    }
    
    get emission() : number {
        return this._emission;
      }

      set emission(value : number) {
        this._emission = value;
    }

    setCalculationStatus(value : string) {
        this.calculationStatus = value;
    }
}
export { Attendee }; 