import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommonResponse } from '@app/services/user.interface';
import { map, pluck} from 'rxjs/operators';
import { IBusLine, ICreateBusLinePayload, ICreateBusLineResponse } from '@app/tab2/tab2.interface';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class BusLineService {
  constructor(private router: Router, private http: HttpClient) {}

  public createBusLine(payload: ICreateBusLinePayload): Observable<ICommonResponse<ICreateBusLineResponse>> {
    return this.http
      .post(`${environment.apiUrl}/busLine`, payload)
      .pipe(map((data: ICommonResponse<ICreateBusLineResponse>) => { return data }));
  }

  public getBusLines(): Observable<IBusLine[]> {
    return this.http.get(`${environment.apiUrl}/busLine`).pipe(
      pluck('data'),
    );
  }

  public getBusLine(id: string): Observable<ICommonResponse<IBusLine>> {
    return this.http
      .get(`${environment.apiUrl}/busLine/${id}`)
      .pipe(map((data: ICommonResponse<IBusLine>) => { return data }));
  }

  public updateBusLine(payload: ICreateBusLinePayload, id: string): Observable<ICommonResponse<IBusLine>> {
    return this.http
      .put(`${environment.apiUrl}/busLine/${id}`, payload)
      .pipe(map((data: ICommonResponse<IBusLine>) => { return data }));
  }

  public deleteBusLine(id: string): Observable<IBusLine> {
    return this.http.delete(`${environment.apiUrl}/busLine/${id}`).pipe(
      pluck('data'),
    );
  }

  public searchBusLines(payload: {
    searchTerm: string;
    searchLimit: number;
    searchSkip: number;
  }): Observable<ICommonResponse<IBusLine[]>> {
    return this.http
      .post(`${environment.apiUrl}/busLine/search`, payload)
      .pipe(map((data: ICommonResponse<IBusLine[]>) => { return data }));
  }
}
