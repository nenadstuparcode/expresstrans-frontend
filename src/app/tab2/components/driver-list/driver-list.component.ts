import { Component, OnInit } from '@angular/core';
import { ActionSheetController, AlertController, ModalController, ToastController } from '@ionic/angular';
import { CreateDriverComponent } from '@app/tab2/components/create-driver/create-driver.component';
import { UpdateDriverComponent } from '@app/tab2/components/update-driver/update-driver.component';
import { DriverService } from '@app/tab2/driver.service';
import { filter, take, takeUntil, tap } from 'rxjs/operators';
import { IDriver, IVehicle } from '@app/tab2/tab2.interface';
import { Subject } from 'rxjs';
import { CreateVehicleComponent } from '@app/tab2/components/create-vehicle/create-vehicle.component';
import { UpdateVehicleComponent } from '@app/tab2/components/update-vehicle/update-vehicle.component';

@Component({
  selector: 'app-driver-list',
  templateUrl: './driver-list.component.html',
  styleUrls: ['./driver-list.component.scss'],
})
export class DriverListComponent implements OnInit {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public drivers: IDriver[] = [];
  public vehicles: IVehicle[] = [];
  public config: any = {
    title: 'vozila',
    icon: 'car-outline',
    description: 'Vozači i tablice',
    color: '#E63135',
  };

  constructor(
    private actionSheetController: ActionSheetController,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private driverService: DriverService,
    private toastCtrl: ToastController,
  ) {}

  public ngOnInit(): void {
    this.getDrivers();
    this.getVehicles();
  }

  public getDrivers(): void {
    this.driverService
      .getDrivers()
      .pipe(
        filter((data: IDriver[]) => !!data),
        tap((data: IDriver[]) => (this.drivers = data)),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();
  }

  public getVehicles(): void {
    this.driverService
      .getVehicles()
      .pipe(
        filter((data: IVehicle[]) => !!data),
        tap((data: IVehicle[]) => (this.vehicles = data)),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();
  }

  public async presentActionSheet2(vehicle: IVehicle): Promise<void> {
    const actionSheet: HTMLIonActionSheetElement = await this.actionSheetController.create({
      header: 'Akcije',
      cssClass: 'my-custom-class',
      buttons: [
        {
          text: 'Uredi',
          role: 'uredi',
          icon: 'create-sharp',
          handler: () => {
            this.updateVehicle(vehicle);
          },
        },
        {
          text: 'Poništi',
          icon: 'trash-sharp',
          handler: () => {
            this.deleteVehicleAlert(vehicle._id);
          },
        },
        {
          text: 'Odustani',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  public async presentActionSheet(driver: IDriver): Promise<void> {
    const actionSheet: HTMLIonActionSheetElement = await this.actionSheetController.create({
      header: 'Akcije',
      cssClass: 'my-custom-class',
      buttons: [
        {
          text: 'Uredi',
          role: 'uredi',
          icon: 'create-sharp',
          handler: () => {
            this.updateDriver(driver);
          },
        },
        {
          text: 'Poništi',
          icon: 'trash-sharp',
          handler: () => {
            this.deleteDriverAlert(driver._id);
          },
        },
        {
          text: 'Odustani',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  public async createDriver(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({ component: CreateDriverComponent });

    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        const newDriver: IDriver = data.data;
        this.drivers.unshift(newDriver);
      }
    });

    return await modal.present();
  }

  public async createVehicle(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({ component: CreateVehicleComponent });

    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        const newVehicle: IVehicle = data.data;
        this.vehicles.unshift(newVehicle);
      }
    });

    return await modal.present();
  }

  public async updateDriver(data: IDriver): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: UpdateDriverComponent,
      componentProps: {
        driverData: data,
      },
    });

    modal.onDidDismiss().then((res: any) => {
      if (res.role === 'update') {
        const newDriver: IDriver = res.data;
        this.drivers = this.drivers.filter((driver: IDriver) => driver._id !== newDriver._id);
        this.drivers.unshift(newDriver);
      }
    });

    return await modal.present();
  }

  public async updateVehicle(data: IVehicle): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: UpdateVehicleComponent,
      componentProps: {
        vehicleData: data,
      },
    });

    modal.onDidDismiss().then((res: any) => {
      if (res.role === 'update') {
        const newVehicle: IVehicle = res.data;
        this.vehicles = this.vehicles.filter((vehicle: IVehicle) => vehicle._id !== newVehicle._id);
        this.vehicles.unshift(newVehicle);
      }
    });

    return await modal.present();
  }

  public async deleteDriverAlert(id: string): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Obriši Vozaca?',
      message: 'Da li ste sigurni da želite da obrišete vozaca?',
      buttons: [
        {
          text: 'Otkaži',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Obriši',
          handler: () => {
            this.deleteDriver(id);
          },
        },
      ],
    });

    await alert.present();
  }

  public async deleteVehicleAlert(id: string): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Obriši Vozilo?',
      message: 'Da li ste sigurni da želite da obrišete vozilo?',
      buttons: [
        {
          text: 'Otkaži',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Obriši',
          handler: () => {
            this.deleteDriver(id);
          },
        },
      ],
    });

    await alert.present();
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'primary',
    });

    await toast.present();
  }

  public deleteDriver(driverId: string): void {
    this.driverService
      .deleteDriver(driverId)
      .pipe(
        take(1),
        tap(() => {
          this.presentToast('Vozac je obrisan');
          this.drivers = [...this.drivers.filter((driver: IDriver) => driver._id !== driverId)];
        }),
      )
      .subscribe();
  }

  public deleteVehicle(vehicleId: string): void {
    this.driverService
      .deleteVehicle(vehicleId)
      .pipe(
        take(1),
        tap(() => {
          this.presentToast('Vozilo je obrisano');
          this.vehicles = [...this.vehicles.filter((vehicle: IVehicle) => vehicle._id !== vehicleId)];
        }),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();
  }
}
