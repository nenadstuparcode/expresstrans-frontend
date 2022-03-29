import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ModalController } from '@ionic/angular';
import { filter, take, tap } from 'rxjs/operators';
import { ICommonResponse } from '@app/services/user.interface';
import { ICreateVehicleResponse } from '@app/tab2/tab2.interface';
import { Subject, throwError } from 'rxjs';
import { DriverService } from '@app/tab2/driver.service';

@Component({
  selector: 'app-driver-create',
  templateUrl: './create-vehicle.component.html',
  styleUrls: ['./create-vehicle.component.scss'],
})
export class CreateVehicleComponent implements OnInit, OnDestroy {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public createVehicleForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private driverService: DriverService,
    private loadingCtrl: LoadingController,
  ) {}

  public ngOnInit(): void {
    this.createVehicleForm = this.fb.group({
      plateNumber: this.fb.control('', Validators.required),
    });
  }

  public dismissModal(): void {
    this.modalCtrl.dismiss(null, 'dismiss');
  }

  public createDriver(): void {
    this.handleButtonClick()
      .then(() => {
        this.driverService
          .createVehicle(this.createVehicleForm.value)
          .pipe(
            take(1),
            filter((data: ICommonResponse<ICreateVehicleResponse>) => !!data && this.createVehicleForm.valid),
            tap((data: ICommonResponse<ICreateVehicleResponse>) => {
              this.loadingCtrl.dismiss();
              this.modalCtrl.dismiss(data.data, 'save');
            }),
          )
          .subscribe();
      })
      .catch((error: Error) => throwError(error));
  }

  public async handleButtonClick(): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingCtrl.create({
      message: 'Kreiranje vozila...',
    });

    await loading.present();
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
