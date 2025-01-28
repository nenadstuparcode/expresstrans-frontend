import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'any',
})
export class ReportTicketsService {
  constructor(private http: HttpClient) { }
  private API_URL: string = 'https://api.tableconvert.com/v2/convert/html-to-excel';
  private API_KEY: string = 'YP6hnV8zOtzvTvDdirK3JVdk8UkYmeCU';

  public convertTableToExcel(htmlToConvert: string): Observable<any> {
    return this.http.post(
      this.API_URL,
      { data: htmlToConvert, 'output[textFormat]': true, 'output[autoWidth]': false },
      { headers: new HttpHeaders({ 'Authorization': `Bearer ${this.API_KEY}` })});
  }
}
