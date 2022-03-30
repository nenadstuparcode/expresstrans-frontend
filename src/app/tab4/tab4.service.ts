import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommonResponse } from '@app/services/user.interface';
import { environment } from '@env/environment';
import { filter, map, pluck } from 'rxjs/operators';
import { IReservation, IReservationCreatePayload } from '@app/tab4/tab4.interface';
import {ITicket} from "@app/tab1/ticket.interface";

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  constructor(private router: Router, private http: HttpClient) {}

  public createReservation(payload: IReservationCreatePayload): Observable<ICommonResponse<IReservation>> {
    return this.http
      .post(`${environment.apiUrl}/reservation`, payload)
      .pipe(filter((data: ICommonResponse<IReservation>) => !!data));
  }

  public getReservations(): Observable<IReservation[]> {
    return this.http.get(`${environment.apiUrl}/reservation`).pipe(pluck('data'));
  }

  public getReservation(id: string): Observable<ICommonResponse<IReservation>> {
    return this.http.get(`${environment.apiUrl}/reservation/${id}`).pipe(
      map((data: ICommonResponse<IReservation>) => {
        return data;
      }),
    );
  }

  public updateReservation(payload: IReservationCreatePayload, id: string): Observable<ICommonResponse<IReservation>> {
    return this.http.put(`${environment.apiUrl}/reservation/${id}`, payload).pipe(
      map((data: ICommonResponse<IReservation>) => {
        return data;
      }),
    );
  }

  public deleteReservation(id: string): Observable<IReservation> {
    return this.http.delete(`${environment.apiUrl}/reservation/${id}`).pipe(pluck('data'));
  }

  public searchReservationsByDate(payload: {
    searchTerm: string;
    pageNumber: number;
    resultPerPage: number;
    startDate: string;
    endDate: string;
    sortByProp: string;
    sortOption: number;
  }): Observable<ICommonResponse<IReservation[]>> {
    return this.http
      .post(`${environment.apiUrl}/reservation/search-date`, payload)
      .pipe(map((data: ICommonResponse<IReservation[]>) => { return data }));
  }

  public searchReservations(payload: {
    searchTerm: string;
    searchLimit: number;
    searchSkip: number;
  }): Observable<ICommonResponse<IReservation[]>> {
    return this.http.post(`${environment.apiUrl}/reservation/search`, payload).pipe(
      map((data: ICommonResponse<IReservation[]>) => {
        return data;
      }),
    );
  }
}
