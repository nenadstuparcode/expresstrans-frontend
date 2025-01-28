import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from 'rxjs';
import { ICommonResponse } from '@app/services/user.interface';
import { map } from 'rxjs/operators';
import {ITicket, TicketType} from '@app/tab1/ticket.interface';
import { environment } from '@env/environment';
import {IFinals, IGeneral, ITotals} from '@app/tab2/components/reports-city/reports-city.component';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private API_URL: string = 'https://api.tableconvert.com/v2/convert/html-to-excel';
  private API_KEY: string = 'YP6hnV8zOtzvTvDdirK3JVdk8UkYmeCU';
  constructor(private router: Router, private http: HttpClient) {}

  public reportTickets(payload: {
    searchTerm: string;
    pageNumber: number;
    resultPerPage: number;
    startDate: string;
    endDate: string;
    sortByProp: string;
    sortOption: number;
    excludeTicketType?: TicketType.internet,
  }): Observable<ICommonResponse<ITicket[]>> {
    return this.http
      .post(`${environment.apiUrl}/ticket/report`, payload)
      .pipe(map((data: ICommonResponse<ITicket[]>) => { return data }));
  }

  //'responseType'  : 'blob' as 'json'        //This also worked
  public printReport(general: IGeneral[], month: string, year: string, totals: ITotals, finals: IFinals): Observable<ArrayBuffer> {
    const httpOptions: any = {
      responseType: 'arraybuffer' as 'json',
    };

    return this.http.post(`${environment.apiUrl}/ticket/report-print`, { general, month, year, totals, finals }, httpOptions).pipe(
      map((data: ArrayBuffer) => data),
    );
  }

  public convertTableToExcel(htmlToConvert: string): Observable<any> {
    return this.http.post(
      this.API_URL,
      { data: htmlToConvert, 'output[textFormat]': true, 'output[autoWidth]': false },
      { headers: new HttpHeaders({ 'Authorization': `Bearer ${this.API_KEY}` })}).pipe(
      map((data: ArrayBuffer) => data),
    );
  }
}
