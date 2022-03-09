import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { DriverService } from '@app/tab2/driver.service';
import { IVehicle } from '@app/tab2/tab2.interface';
import { catchError, filter, take, takeUntil, tap } from 'rxjs/operators';
import { ICommonResponse } from '@app/services/user.interface';
import { Subject, throwError } from 'rxjs';

@Component({
  selector: 'app-vehicle-update',
  templateUrl: './update-vehicle.component.html',
  styleUrls: ['./update-vehicle.component.scss'],
})
export class UpdateVehicleComponent implements OnInit, OnDestroy {
  @Input() public vehicleData: IVehicle;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public updateVehicleForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private driverService: DriverService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {}

  public ngOnInit(): void {
    this.updateVehicleForm = this.fb.group({
      plateNumber: this.fb.control(this.vehicleData.plateNumber, Validators.required),
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
    });
    await toast.present();
  }

  public updateDriver(): void {
    this.handleButtonClick('Azuriranje vozila...')
      .then(() => {
        this.driverService
          .updateVehicle(this.updateVehicleForm.value, this.vehicleData._id)
          .pipe(
            filter((res: ICommonResponse<IVehicle>) => !!res && this.updateVehicleForm.valid),
            take(1),
            tap((res: ICommonResponse<IVehicle>) => {
              this.loadingCtrl.dismiss();
              this.presentToast('Vozilo uspjesno azurirano.');
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
