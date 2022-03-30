import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, throwError } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserServiceService } from '@app/services/user-service.service';
import { IUserRegister } from '@app/services/user.interface';
import { catchError, take, tap } from 'rxjs/operators';
import { LoadingController, ToastController } from '@ionic/angular';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class RegisterPage implements OnInit, OnDestroy {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public showPassword1: boolean = false;
  public showPassword2: boolean = false;
  public registrationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: UserServiceService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router,
  ) {}

  public ngOnInit(): void {
    this.registrationForm = this.fb.group(
      {
        firstName: this.fb.control('', [Validators.required, Validators.minLength(3)]),
        lastName: this.fb.control('', [Validators.required, Validators.minLength(3)]),
        password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
        confirmPassword: this.fb.control('', [Validators.required, Validators.minLength(6)]),
        email: this.fb.control('', [Validators.required, Validators.email]),
      },
      { validator: this.checkPasswords },
    );
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

  public register(): void {
    this.presentLoading('Registracija u toku')
      .then(() => {
        const userData: IUserRegister = {
          firstName: this.registrationForm.controls.firstName.value,
          lastName: this.registrationForm.controls.lastName.value,
          email: this.registrationForm.controls.email.value,
          password: this.registrationForm.controls.password.value,
        };

        this.service
          .register(userData)
          .pipe(
            take(1),
            tap(() => {
              this.presentToast('Uspjesna registracija');
              this.loadingCtrl.dismiss();
              this.router.navigate(['/otp']);
            }),
            catchError((err: Error) => {
              this.loadingCtrl.dismiss();
              this.presentToast(err.message);

              return throwError(err);
            }),
          )
          .subscribe();
      })
      .catch((error: Error) => {
        this.loadingCtrl.dismiss();

        return throwError(error);
      });
  }

  public checkPasswords(group: FormGroup): any {
    const pass: string = group.controls.password.value;
    const confirmPass: string = group.controls.confirmPassword.value;

    return pass === confirmPass ? null : { notSame: true };
  }

  public toggleShowPassword1(): void {
    this.showPassword1 = !this.showPassword1;
  }

  public toggleShowPassword2(): void {
    this.showPassword2 = !this.showPassword2;
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
