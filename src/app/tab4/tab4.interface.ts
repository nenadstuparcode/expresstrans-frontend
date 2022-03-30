import {IBusLine} from "@app/tab2/tab2.interface";

export interface IReservation {
  _id: string;
  reservationOnName: string;
  reservationPhone: string;
  reservationTime: string;
  reservationDate: string;
  reservationNote: string;
  ticketBusLineId: string;
  busLineData?: IBusLine;
}

export interface IReservationCreatePayload {
  reservationOnName: string;
  reservationPhone: string;
  reservationTime: string;
  reservationDate: string;
  reservationNote: string;
  ticketBusLineId: string;
}
