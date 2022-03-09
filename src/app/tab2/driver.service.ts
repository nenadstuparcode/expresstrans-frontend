import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ICommonResponse } from '@app/services/user.interface';
import { catchError, filter, pluck } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  ICreateDriverPayload,
  ICreateDriverResponse,
  ICreateVehiclePayload,
  ICreateVehicleResponse,
  IDriver,
  IVehicle,
} from '@app/tab2/tab2.interface';

@Injectable({
  providedIn: 'root',
})
export class DriverService {
  constructor(private router: Router, private http: HttpClient) {}

  // Driver API
  public createDriver(payload: ICreateDriverPayload): Observable<ICommonResponse<ICreateDriverResponse>> {
    return this.http
      .post(`${environment.apiUrl}/driver`, payload)
      .pipe(filter((data: ICommonResponse<ICreateDriverResponse>) => !!data));
  }

  public getDrivers(): Observable<IDriver[]> {
    return this.http.get(`${environment.apiUrl}/driver`).pipe(
      filter((data: ICommonResponse<IDriver[]>) => !!data),
      pluck('data'),
      catchError((error: Error) => throwError(error)),
    );
  }

  public getBusLine(id: string): Observable<ICommonResponse<IDriver>> {
    return this.http.get(`${environment.apiUrl}/driver/${id}`).pipe(filter((data: ICommonResponse<IDriver>) => !!data));
  }

  public updateDriver(payload: ICreateDriverPayload, id: string): Observable<ICommonResponse<IDriver>> {
    return this.http
      .put(`${environment.apiUrl}/driver/${id}`, payload)
      .pipe(filter((data: ICommonResponse<IDriver>) => !!data));
  }

  public deleteDriver(id: string): Observable<ICreateDriverResponse> {
    return this.http.delete(`${environment.apiUrl}/driver/${id}`).pipe(
      filter((data: ICommonResponse<ICreateDriverResponse>) => !!data),
      pluck('data'),
    );
  }

  // Vehicle API
  public createVehicle(payload: ICreateVehiclePayload): Observable<ICommonResponse<ICreateVehicleResponse>> {
    return this.http
      .post(`${environment.apiUrl}/vehicle`, payload)
      .pipe(filter((data: ICommonResponse<ICreateVehicleResponse>) => !!data));
  }

  public getVehicles(): Observable<IVehicle[]> {
    return this.http.get(`${environment.apiUrl}/vehicle`).pipe(
      filter((data: ICommonResponse<IVehicle[]>) => !!data),
      pluck('data'),
      catchError((error: Error) => throwError(error)),
    );
  }

  public getVehicle(id: string): Observable<ICommonResponse<IVehicle>> {
    return this.http
      .get(`${environment.apiUrl}/vehicle/${id}`)
      .pipe(filter((data: ICommonResponse<IVehicle>) => !!data));
  }

  public updateVehicle(payload: ICreateVehiclePayload, id: string): Observable<ICommonResponse<IVehicle>> {
    return this.http
      .put(`${environment.apiUrl}/vehicle/${id}`, payload)
      .pipe(filter((data: ICommonResponse<IVehicle>) => !!data));
  }

  public deleteVehicle(id: string): Observable<ICreateVehicleResponse> {
    return this.http.delete(`${environment.apiUrl}/vehicle/${id}`).pipe(
      filter((data: ICommonResponse<ICreateVehicleResponse>) => !!data),
      pluck('data'),
    );
  }
}
