import { Component, OnInit } from '@angular/core';
import { UserServiceService } from '@app/services/user-service.service';
import { Subject, throwError } from 'rxjs';
import { takeUntil, filter, tap, catchError } from 'rxjs/operators';
import { IResponse } from '@app/services/user.interface';
import { LoadingController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.page.html',
  styleUrls: ['./otp.page.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class OtpPage implements OnInit {
  public otpForm: FormGroup;
  public componentDestroyed$: Subject<void> = new Subject<void>();

  constructor(
    private service: UserServiceService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private fb: FormBuilder,
    private router: Router,
  ) {}

  public ngOnInit(): void {
    this.otpForm = this.fb.group({
      email: this.fb.control('', Validators.required),
      code: this.fb.control('', Validators.required),
    });
  }

  public sendVerificationCode(): void {
    this.presentLoading('Slanje Verifikacijskog koda..').then(() => {
      this.service
        .submitVerificationCode(this.otpForm.controls.email.value, this.otpForm.controls.code.value)
        .pipe(
          tap((data: IResponse) => {
            data.status === 1 ? this.presentToast('Kod je validan.') : this.presentToast('Kod nije validan');
          }),
          tap(() => {
            this.loadingCtrl.dismiss();
            this.router.navigate(['/login']);
          }),
          catchError((error: Error) => {
            this.loadingCtrl.dismiss();

            return throwError(error);
          }),
          takeUntil(this.componentDestroyed$),
        )
        .subscribe();
    }).catch((error: Error) => {
      this.loadingCtrl.dismiss();

      return throwError(error);
    });
  }

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingCtrl.create({ message: msg });
    await loading.present();
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'primary',
    });
    toast.present();
  }

  public resendVerificationCode(): void {
    this.service
      .resendVerificationCode(this.otpForm.controls.email.value)
      .pipe(
        takeUntil(this.componentDestroyed$),
        filter((data: IResponse) => !!data),
        tap((data: IResponse) => {
          data.status === 1
            ? this.presentToast('Kod je poslan na email adresu.')
            : this.presentToast('Ponovno slanje koda nije uspjelo');
        }),
        catchError((err: any) => {
          this.presentToast(err);

          return throwError(err);
        }),
      )
      .subscribe();
  }
}
