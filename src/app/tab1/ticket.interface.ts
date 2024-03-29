import {IBusLine} from '@app/tab2/tab2.interface';

export enum TicketType {
  classic = 'classic',
  internet = 'internet',
  return = 'return',
  gratis = 'gratis',
  agency = 'agency',
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
  ticketDiscount: number;
  ticketValid: number;
  ticketInvoiceNumber: number;
  ticketInvoicePublicId?: number;
  ticketDisabled?: boolean;
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
  ticketInvoicePublicId?: number;
  ticketClassicId: string;
  ticketId: string;
  ticketPrice: number;
  ticketDiscount: number;
  createdAt: string;
  modifiedAt: string;
  ticketDisabled?: boolean;
}

export interface ITicket {
  _id: string;
  ticketOnName: string;
  ticketClassicIdToSort?: number;
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
  ticketInvoicePublicId?: number;
  ticketClassicId: string;
  ticketId: string;
  ticketPrice: number;
  ticketDiscount: number;
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
  ticketDisabled?: boolean;
}
