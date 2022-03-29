import {IBusLine} from '@app/tab2/tab2.interface';

export enum TicketType {
  classic = 'classic',
  internet = 'internet',
  return = 'return',
}

export interface ICreateTicketPayload {
  ticketBusLineId: string;
  ticketEmail: string;
  ticketNote: string;
  ticketOnName: string;
  ticketPhone: string;
  ticketType: string;
  ticketClassicId: string;
  ticketRoundTrip: boolean;
  ticketStartDate: string;
  ticketStartTime: string;
  ticketPrice: number;
  ticketValid: number;
  ticketInvoiceNumber: number;
}

export interface ICreateTicketResponse {
  _id: string;
  id: string;
  ticketOnName: string;
  ticketPhone: string;
  ticketEmail: string;
  ticketNote: string;
  ticketType: string;
  ticketValid: number;
  ticketBusLineId: string;
  ticketRoundTrip: boolean;
  ticketStartDate: string;
  ticketStartTime: string;
  ticketInvoiceNumber: number;
  ticketClassicId: string;
  ticketId: string;
  ticketPrice: number;
  createdAt: string;
  modifiedAt: string;
}

export interface ITicket {
  _id: string;
  ticketOnName: string;
  ticketPhone: string;
  ticketEmail: string;
  ticketNote: string;
  ticketValid: number;
  ticketType: string;
  ticketBusLineId: string;
  ticketRoundTrip: boolean;
  ticketStartDate: string;
  ticketStartTime: string;
  ticketInvoiceNumber: number;
  ticketClassicId: string;
  ticketId: string;
  ticketPrice: number;
  createdAt: string;
  modifiedAt: string;
  busLineData?: IBusLine;
  position?: number;
  totalKilometers?: number;
  taxInDE?: number;
  taxCalculatedOne?: number;
  taxCalculatedTwo?: number;
  returnTaxDE?: number;
  ticketIdToShow?: string;
  month?: string;
  year?: string;
}
