import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { ICommonResponse, IResponse, IUser, IUserLoginResponse, IUserRegister } from '@app/services/user.interface';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class UserServiceService {
  private userSubject: BehaviorSubject<IUser>;
  public user: Observable<IUser>;
  public isLoggedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private router: Router, private http: HttpClient) {
    this.userSubject = new BehaviorSubject<IUser>(JSON.parse(localStorage.getItem('user')));
    this.user = this.userSubject.asObservable();

    if (JSON.parse(localStorage.getItem('user'))) {
      this.isLoggedIn$.next(true);
    }
  }

  public getUser(): IUser {
    return this.userSubject.value;
  }

  public login(email: string, password: string): Observable<ICommonResponse<IUser>> {
    return this.http.post(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      map((data: ICommonResponse<IUser>) => {
        this.userSubject.next(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));

        return data;
      }),
      tap(() => {
        this.isLoggedIn$.next(true);
      }),
    );
  }

  public logout(): void {
    this.isLoggedIn$.next(false);
    localStorage.removeItem('user');
    this.userSubject.next(null);
    this.user = EMPTY;
    this.router.navigate(['/login']);
  }

  public register(user: IUserRegister): Observable<IUser> {
    return this.http
      .post(`${environment.apiUrl}/auth/register`, {
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password,
        email: user.email,
      })
      .pipe(
        map((data: ICommonResponse<IUser>) => data.data),
      );
  }

  public submitVerificationCode(email: string, code: number): Observable<IResponse> {
    return this.http.post(`${environment.apiUrl}/auth/verify-otp`, { email: email, otp: code }).pipe(
      map((data: IUserLoginResponse) => {
        return data;
      }),
    );
  }

  public resendVerificationCode(email: string): Observable<IResponse> {
    return this.http.post(`${environment.apiUrl}/auth/resend-verify-otp`, { email }).pipe(
      map((data: IResponse) => {
        return data;
      }),
    );
  }
}
