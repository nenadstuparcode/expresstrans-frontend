import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommonResponse } from '@app/services/user.interface';
import { filter, pluck, map } from 'rxjs/operators';
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

  public createDriver(payload: ICreateDriverPayload): Observable<ICommonResponse<ICreateDriverResponse>> {
    return this.http
      .post(`${environment.apiUrl}/driver`, payload)
      .pipe(map((data: ICommonResponse<ICreateDriverResponse>) => { return data }));
  }

  public getDrivers(): Observable<IDriver[]> {
    return this.http.get(`${environment.apiUrl}/driver`).pipe(
      map((data: ICommonResponse<IDriver[]>) => { return data }),
      pluck('data'),
    );
  }

  public getBusLine(id: string): Observable<ICommonResponse<IDriver>> {
    return this.http.get(`${environment.apiUrl}/driver/${id}`).pipe(filter((data: ICommonResponse<IDriver>) => !!data));
  }

  public updateDriver(payload: ICreateDriverPayload, id: string): Observable<ICommonResponse<IDriver>> {
    return this.http
      .put(`${environment.apiUrl}/driver/${id}`, payload)
      .pipe(map((data: ICommonResponse<IDriver>) => { return data }));
  }

  public deleteDriver(id: string): Observable<ICreateDriverResponse> {
    return this.http.delete(`${environment.apiUrl}/driver/${id}`).pipe(
      map((data: ICommonResponse<ICreateDriverResponse>) => { return data }),
      pluck('data'),
    );
  }

  // Vehicle API
  public createVehicle(payload: ICreateVehiclePayload): Observable<ICommonResponse<ICreateVehicleResponse>> {
    return this.http
      .post(`${environment.apiUrl}/vehicle`, payload)
      .pipe(map((data: ICommonResponse<ICreateVehicleResponse>) => { return data }));
  }

  public getVehicles(): Observable<IVehicle[]> {
    return this.http.get(`${environment.apiUrl}/vehicle`).pipe(
      map((data: ICommonResponse<IVehicle[]>) => { return data }),
      pluck('data'),
    );
  }

  public getVehicle(id: string): Observable<ICommonResponse<IVehicle>> {
    return this.http
      .get(`${environment.apiUrl}/vehicle/${id}`)
      .pipe(map((data: ICommonResponse<IVehicle>) => { return data }));
  }

  public updateVehicle(payload: ICreateVehiclePayload, id: string): Observable<ICommonResponse<IVehicle>> {
    return this.http
      .put(`${environment.apiUrl}/vehicle/${id}`, payload)
      .pipe(map((data: ICommonResponse<IVehicle>) => { return data }));
  }

  public deleteVehicle(id: string): Observable<ICreateVehicleResponse> {
    return this.http.delete(`${environment.apiUrl}/vehicle/${id}`).pipe(
      map((data: ICommonResponse<ICreateVehicleResponse>) => { return data }),
      pluck('data'),
    );
  }
}
