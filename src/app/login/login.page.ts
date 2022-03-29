import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserServiceService } from '@app/services/user-service.service';
import { Subject, throwError } from 'rxjs';
import { catchError, filter, take, tap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public showPassword1: boolean = false;
  public loginForm: FormGroup;

  constructor(
    private userService: UserServiceService,
    private fb: FormBuilder,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
  ) {}

  public ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: this.fb.control('', [Validators.required, Validators.email]),
      password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
    });
  }

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingCtrl.create({
      cssClass: 'my-custom-class',
      message: msg,
    });

    await loading.present().catch((err: Error) => {
      this.presentToast(err.message);
    });
  }

  public login(): void {
    this.presentLoading('Prijava u toku')
      .then(() => {
        this.userService
          .login(this.loginForm.get('email').value, this.loginForm.get('password').value)
          .pipe(
            filter(() => this.loginForm.valid),
            take(1),
            tap(() => {
              this.router.navigate(['/karte']);
              this.loadingCtrl.dismiss();
            }),
            catchError((error: Error) => {
              this.loadingCtrl.dismiss();
              this.presentToast(error.message);

              return throwError(error);
            }),
          )
          .subscribe();
      })
      .catch((error: Error) => {
        this.loadingCtrl.dismiss();
        this.presentToast(error.message);

        return throwError(error);
      });
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'primary',
    });
    toast.present();
  }

  public toggleShowPassword1(): void {
    this.showPassword1 = !this.showPassword1;
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
