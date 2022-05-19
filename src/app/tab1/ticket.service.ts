import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommonResponse } from '@app/services/user.interface';
import { map, pluck } from 'rxjs/operators';
import {ICreateTicketPayload, ICreateTicketResponse, ITicket} from '@app/tab1/ticket.interface';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  constructor(private router: Router, private http: HttpClient) {}

  public createTicket(payload: ICreateTicketPayload): Observable<ICommonResponse<ICreateTicketResponse>> {
    return this.http.post(`${environment.apiUrl}/ticket`, payload).pipe(
      map((data: ICommonResponse<ICreateTicketResponse>) => {
        return data;
      }),
    );
  }

  public getTickets(): Observable<ITicket[]> {
    return this.http.get(`${environment.apiUrl}/ticket`).pipe(
      map((data: ICommonResponse<ITicket[]>) => {
        return data;
      }),
      pluck('data'),
    );
  }

  public getTicketByType(payload: {
    searchTerm: string;
    pageNumber: number;
    resultPerPage: number;
    startDate: string;
    endDate: string;
    sortByProp: string;
    sortOption: number;
  }): Observable<ICommonResponse<ITicket[]>> {
    return this.http.post(`${environment.apiUrl}/ticket/ticket-type`, payload).pipe(
      map((data: ICommonResponse<ITicket[]>) => {
        return data;
      }),
    )
  }

  public getTicket(id: string): Observable<ICommonResponse<ITicket>> {
    return this.http.get(`http://localhost:3000/api/busLine/${id}`).pipe(
      map((data: ICommonResponse<ITicket>) => {
        return data;
      }),
    );
  }

  public updateTicket(payload: ICreateTicketPayload, id: string): Observable<ICommonResponse<ITicket>> {
    return this.http.put(`${environment.apiUrl}/ticket/${id}`, payload).pipe(
      map((data: ICommonResponse<ITicket>) => {
        return data;
      }),
    );
  }

  public deleteTicket(id: string): Observable<ICommonResponse<any>> {
    return this.http.delete(`${environment.apiUrl}/ticket/${id}`).pipe(
      map((data: ICommonResponse<ITicket>) => {
        return data;
      }),
    );
  }

  public searchTickets(payload: {
    searchTerm: string;
    searchLimit: number;
    searchSkip: number;
  }): Observable<ICommonResponse<ITicket[]>> {
    return this.http.post(`${environment.apiUrl}/ticket/search`, payload).pipe(
      map((data: ICommonResponse<ITicket[]>) => {
        return data;
      }),
    );
  }

  public getTicketsByInvoice(invoiceNr: number): Observable<ICommonResponse<ITicket[]>> {
    return this.http.post(`${environment.apiUrl}/ticket/invoice`, { invoiceNr }).pipe(
      map((data: ICommonResponse<ITicket[]>) => {
        return data;
      }),
    );
  }

  public printTicket(payload: ITicket): Observable<ArrayBuffer> {
    const httpOptions: any = {
      responseType: 'arraybuffer' as 'json',
    };

    return this.http.post(`${environment.apiUrl}/ticket/print`, payload, httpOptions).pipe(
      map((data: ArrayBuffer) => {
        return data;
      }),
    );
  }

  public emailTicket(payload: ITicket): Observable<ICommonResponse<boolean>> {
    return this.http.post(`${environment.apiUrl}/ticket/email`, payload).pipe(
      map((data: ICommonResponse<boolean>) => {
        return data;
      }),
    );
  }

  public emailTicketCustom(payload: ITicket, receiverEmail: string): Observable<ICommonResponse<boolean>> {
    return this.http.post(`${environment.apiUrl}/ticket/email/${receiverEmail}`, payload).pipe(
      map((data: ICommonResponse<boolean>) => {
        return data;
      }),
    );
  }
}
