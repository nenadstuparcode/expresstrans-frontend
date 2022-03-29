import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommonResponse } from '@app/services/user.interface';
import { filter, map, pluck } from 'rxjs/operators';
import {
  ICreateInvoicePayload,
  ICreateInvoiceResponse,
  IInvoice, IPrintInvoiceTaxPayload,
  IUpdateInvoicePayload,
  IUpdateInvoicePayloadTax,
} from '@app/tab2/tab2.interface';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  constructor(private router: Router, private http: HttpClient) {}

  public createInvoice(payload: ICreateInvoicePayload): Observable<ICommonResponse<ICreateInvoiceResponse>> {
    return this.http
      .post(`${environment.apiUrl}/invoice`, payload)
      .pipe(filter((data: ICommonResponse<ICreateInvoiceResponse>) => !!data));
  }

  public getInvoices(): Observable<IInvoice[]> {
    return this.http.get(`${environment.apiUrl}/invoice`).pipe(pluck('data'));
  }

  public getInvoice(id: string): Observable<ICommonResponse<IInvoice>> {
    return this.http.get(`${environment.apiUrl}/invoice/${id}`).pipe(
      map((data: ICommonResponse<IInvoice>) => {
        return data;
      }),
    );
  }

  public updateInvoice(payload: ICreateInvoicePayload, id: string): Observable<ICommonResponse<IInvoice>> {
    return this.http.put(`${environment.apiUrl}/invoice/${id}`, payload).pipe(
      map((data: ICommonResponse<IInvoice>) => {
        return data;
      }),
    );
  }

  public updateInvoiceExpenses(payload: IUpdateInvoicePayload, id: string): Observable<ICommonResponse<IInvoice>> {
    return this.http.put(`${environment.apiUrl}/invoice/expenses/${id}`, payload).pipe(
      map((data: ICommonResponse<IInvoice>) => {
        return data;
      }),
    );
  }

  public updateInvoiceTax(payload: IUpdateInvoicePayloadTax, id: string): Observable<ICommonResponse<IInvoice>> {
    return this.http.put(`${environment.apiUrl}/invoice/tax/${id}`, payload).pipe(
      map((data: ICommonResponse<IInvoice>) => {
        return data;
      }),
    );
  }

  public printInvoiceTax(payload: IPrintInvoiceTaxPayload): Observable<ArrayBuffer> {
    const httpOptions: any = {
      responseType: 'arraybuffer' as 'json',
    };

    return this.http.post(`${ environment.apiUrl}/invoice/print-tax`, payload, httpOptions).pipe(
      map((data: ArrayBuffer) => {
        return data;
      }),
    );
  }

  public deleteInvoice(id: string): Observable<IInvoice> {
    return this.http.delete(`${environment.apiUrl}/invoice/${id}`).pipe(pluck('data'));
  }

  public searchInvoices(payload: {
    searchTerm: string;
    searchLimit: number;
    searchSkip: number;
  }): Observable<ICommonResponse<IInvoice[]>> {
    return this.http.post(`${environment.apiUrl}/invoice/search`, payload).pipe(
      map((data: ICommonResponse<IInvoice[]>) => {
        return data;
      }),
    );
  }
}
