import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ICommonResponse } from '@app/services/user.interface';
import { catchError, filter, pluck } from 'rxjs/operators';
import { ICreateInvoicePayload, ICreateInvoiceResponse, IInvoice } from '@app/tab2/tab2.interface';
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
    return this.http.get(`${environment.apiUrl}/invoice`).pipe(
      filter((data: ICommonResponse<IInvoice[]>) => !!data),
      pluck('data'),
      catchError((error: Error) => throwError(error)),
    );
  }

  public getInvoice(id: string): Observable<ICommonResponse<IInvoice>> {
    return this.http
      .get(`${environment.apiUrl}/invoice/${id}`)
      .pipe(filter((data: ICommonResponse<IInvoice>) => !!data));
  }

  public updateInvoice(payload: ICreateInvoicePayload, id: string): Observable<ICommonResponse<IInvoice>> {
    return this.http
      .put(`${environment.apiUrl}/invoice/${id}`, payload)
      .pipe(filter((data: ICommonResponse<IInvoice>) => !!data));
  }

  public deleteInvoice(id: string): Observable<IInvoice> {
    return this.http.delete(`${environment.apiUrl}/invoice/${id}`).pipe(
      filter((data: ICommonResponse<IInvoice>) => !!data),
      pluck('data'),
    );
  }

  public searchInvoices(payload: {
    searchTerm: string;
    searchLimit: number;
    searchSkip: number;
  }): Observable<ICommonResponse<IInvoice[]>> {
    return this.http
      .post(`${environment.apiUrl}/invoice/search`, payload)
      .pipe(filter((data: ICommonResponse<IInvoice[]>) => !!data));
  }
}
