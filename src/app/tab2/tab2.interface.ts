export interface ICreateBusLinePayload {
  lineCityStart: string;
  lineCityEnd: string;
  linePriceOneWay: number;
  linePriceRoundTrip: number;
  lineCountryStart: CountryStart;
  lineArray: any[];
  busLineNr: number;
  bihKilometers: number;
  deKilometers: number;
  tranzitKilometers: number;
}

export interface ICreateBusLineResponse {
  createdAt: string;
  modifiedAt: string;
  id: string;
  lineCityEnd: string;
  lineCityStart: string;
  lineCountryStart: CountryStart;
  linePriceOneWay: number;
  linePriceRoundTrip: number;
  lineArray: any[];
  bihKilometers: number;
  deKilometers: number;
  tranzitKilometers: number;
}

export interface IBusLine {
  _id: string;
  lineCityStart: string;
  lineCityEnd: string;
  linePriceOneWay: number;
  linePriceRoundTrip: number;
  lineCountryStart: CountryStart;
  lineArray: any[];
  bihKilometers: number;
  deKilometers: number;
  tranzitKilometers: number;
  createdAt: string;
  modifiedAt: string;
}

export enum CountryStart {
  bih = 'bih',
  de = 'de',
}

export interface IDriver {
  _id: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
}

export interface ICreateDriverResponse {
  _id: string;
  name: string;
}

export interface ICreateDriverPayload {
  name: string;
}

export interface IVehicle {
  _id: string;
  plateNumber: string;
  createdAt: string;
  modifiedAt: string;
}

export interface ICreateVehicleResponse {
  _id: string;
  plateNumber: string;
}

export interface ICreateVehiclePayload {
  plateNumber: string;
}

export interface ICreateInvoicePayload {
  invoiceDateStart: string;
  invoiceDateReturn: string;
  invoiceVehicle: string;
  invoiceDrivers: string[];
  invoiceNumber: number;
}

export interface  ICreateInvoiceResponse {
  _id: string;
  invoiceNumber: number;
  invoiceDateStart: string;
  invoiceDateReturn: string;
  invoiceVehicle: string;
  invoiceDrivers: string[];
}

export interface IInvoice {
  _id: string;
  invoiceNumber: number;
  invoiceDateStart: string;
  invoiceDateReturn: string;
  invoiceVehicle: string;
  invoiceDrivers: any[];
  driversArray?: string;
  createdAt: string;
  user: string;
  modifiedAt: string;
}
