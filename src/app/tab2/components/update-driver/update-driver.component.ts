import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { DriverService } from '@app/tab2/driver.service';
import { IDriver } from '@app/tab2/tab2.interface';
import { catchError, filter, take, takeUntil, tap } from 'rxjs/operators';
import { ICommonResponse } from '@app/services/user.interface';
import { Subject, throwError } from 'rxjs';

@Component({
  selector: 'app-driver-update',
  templateUrl: './update-driver.component.html',
  styleUrls: ['./update-driver.component.scss'],
})
export class UpdateDriverComponent implements OnInit, OnDestroy {
  @Input() public driverData: IDriver;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public updateDriverForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private driverService: DriverService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {}

  public ngOnInit(): void {
    this.updateDriverForm = this.fb.group({
      name: this.fb.control(this.driverData.name, Validators.required),
    });
  }

  public dismissModal(): void {
    this.modalCtrl.dismiss(null, 'dismiss');
  }

  public async handleButtonClick(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingCtrl.create({
      message: msg,
    });

    await loading.present();
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
    });
    await toast.present();
  }

  public updateDriver(): void {
    this.handleButtonClick('Azuriranje vozaca...')
      .then(() => {
        this.driverService
          .updateDriver(this.updateDriverForm.value, this.driverData._id)
          .pipe(
            filter((res: ICommonResponse<IDriver>) => !!res && this.updateDriverForm.valid),
            take(1),
            tap((res: ICommonResponse<IDriver>) => {
              this.loadingCtrl.dismiss();
              this.presentToast('Vozac uspjesno azuriran.');
              this.modalCtrl.dismiss(res.data, 'update');
            }),
            catchError((err: any) => {
              this.loadingCtrl.dismiss();

              return throwError(err);
            }),
            takeUntil(this.componentDestroyed$),
          )
          .subscribe();
      })
      .catch((error: Error) => {
        this.loadingCtrl.dismiss();

        return throwError(error);
      });
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
