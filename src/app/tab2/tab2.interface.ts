import {ITicket} from '@app/tab1/ticket.interface';

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
  invoiceExpCro: number;
  invoiceExpSlo: number;
  invoiceExpAus: number;
  invoiceExpGer: number;
  invoiceInitialExpenses: number;
  invoiceInitialExpensesDesc: string;
  invoiceUnexpectedExpenses: number;
  invoiceUnexpectedExpensesDesc: string;
  totalKilometers: number;
  bihKilometers: number;
  diffKilometers: number;
  firstCalculation: number;
  secondCalculation: number;
  returnTaxBih: number;
  invoiceNumber: number;
  invoicePublicId: number;
}

export interface IUpdateInvoicePayload {
  invoiceExpCro: number;
  invoiceExpSlo: number;
  invoiceExpAus: number;
  invoiceExpGer: number;
  invoiceInitialExpenses: number;
  invoiceInitialExpensesDesc: string;
  invoiceUnexpectedExpenses: number;
  invoiceUnexpectedExpensesDesc: string;
  invoiceDrivers: IDriver[];
}

export interface IUpdateInvoicePayloadTax {
  totalKilometers: number;
  bihKilometers: number;
  diffKilometers: number;
  firstCalculation: number;
  secondCalculation: number;
  returnTaxBih: number;
  invoiceDrivers: IDriver[];
}

export interface ICreateInvoiceResponse {
  _id: string;
  invoiceNumber: number;
  invoiceDateStart: string;
  invoiceDateReturn: string;
  invoiceVehicle: string;
  invoiceExpCro: number;
  invoiceExpSlo: number;
  invoiceExpAus: number;
  invoiceExpGer: number;
  invoiceInitialExpenses: number;
  invoiceInitialExpensesDesc: string;
  invoiceUnexpectedExpenses: number;
  invoiceUnexpectedExpensesDesc: string;
  totalKilometers: number;
  bihKilometers: number;
  diffKilometers: number;
  firstCalculation: number;
  secondCalculation: number;
  returnTaxBih: number;
  invoiceDrivers: string[];
  invoicePublicId: number;
}

export interface IInvoice {
  _id: string;
  invoiceNumber: number;
  invoiceDateStart: string;
  invoiceDateReturn: string;
  invoiceVehicle: string;
  invoiceExpCro: number;
  invoiceExpSlo: number;
  invoiceExpAus: number;
  invoiceExpGer: number;
  invoiceInitialExpenses: number;
  invoiceInitialExpensesDesc: string;
  invoiceUnexpectedExpenses: number;
  invoiceUnexpectedExpensesDesc: string;
  totalKilometers: number;
  bihKilometers: number;
  diffKilometers: number;
  firstCalculation: number;
  secondCalculation: number;
  returnTaxBih: number;
  invoiceTotalBill: number;
  invoiceDrivers: any[];
  driversArray?: string;
  createdAt: string;
  invoicePublicId: number;
  user: string;
  modifiedAt: string;
}

export interface IPrintInvoiceTaxPayload {
  invoice: IInvoice;
  bihTickets: ITicket[];
  deTickets: ITicket[];
  expenses: IUpdateInvoicePayload;
  tax: IUpdateInvoicePayloadTax;
  totalPriceDe: number;
  totalPriceBih: number;
  drivers?: string;
  showExpenses?: boolean;
}
