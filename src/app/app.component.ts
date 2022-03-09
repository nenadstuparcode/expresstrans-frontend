import { Component, OnDestroy, OnInit } from '@angular/core';
import { fadeAnimation } from '@app/animations';
import { UserServiceService } from '@app/services/user-service.service';
import { IUser } from '@app/services/user.interface';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  animations: [fadeAnimation],
})
export class AppComponent implements OnInit, OnDestroy {
  public logoUrl: string = 'assets/images/express-trans-logo.png';
  public user: IUser;
  public isLoggedIn$: Observable<boolean>;
  public componentDestroyed$: Subject<void> = new Subject();

  constructor(private accountService: UserServiceService) {}

  public ngOnInit(): void {
    this.isLoggedIn$ = this.accountService.isLoggedIn$;
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  public logout(): void {
    this.accountService.logout();
  }
}
