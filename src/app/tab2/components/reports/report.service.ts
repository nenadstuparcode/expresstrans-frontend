import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommonResponse } from '@app/services/user.interface';
import { filter, map } from 'rxjs/operators';
import { ITicket } from '@app/tab1/ticket.interface';
import { environment } from '@env/environment';
import {ITableData} from '@app/tab2/components/reports-city/reports-city.component';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private router: Router, private http: HttpClient) {}

  public reportTickets(payload: {
    searchTerm: string;
    pageNumber: number;
    resultPerPage: number;
    startDate: string;
    endDate: string;
    sortByProp: string;
    sortOption: number;
  }): Observable<ICommonResponse<ITicket[]>> {
    return this.http
      .post(`${environment.apiUrl}/ticket/report`, payload)
      .pipe(filter((data: ICommonResponse<ITicket[]>) => !!data));
  }

  //'responseType'  : 'blob' as 'json'        //This also worked
  public printReport(generalData: ITableData[], month: string): Observable<ArrayBuffer> {
    const httpOptions: any = {
      responseType: 'arraybuffer' as 'json',
    };

    return this.http.post(`${environment.apiUrl}/ticket/report-print`, { generalData, month }, httpOptions).pipe(
      filter((data: any) => !!data),
      map((data: ArrayBuffer) => data),
    );
  }
}
