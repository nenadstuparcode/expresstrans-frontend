import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ModalController } from '@ionic/angular';
import { filter, take, takeUntil, tap } from 'rxjs/operators';
import { ICommonResponse } from '@app/services/user.interface';
import { ICreateInvoiceResponse, IDriver, IVehicle } from '@app/tab2/tab2.interface';
import { Subject, throwError } from 'rxjs';
import { InvoiceService } from '@app/tab2/invoice.service';
import { DriverService } from '@app/tab2/driver.service';

@Component({
  selector: 'app-driver-create',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss'],
})
export class CreateInvoiceComponent implements OnInit, OnDestroy {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public createInvoiceForm: FormGroup;
  public driverForm: FormGroup;
  public availableDrivers: IDriver[] = [];
  public availableVehicles: IVehicle[] = [];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private invoiceService: InvoiceService,
    private loadingCtrl: LoadingController,
    private driverService: DriverService,
  ) {}

  public ngOnInit(): void {
    this.getDrivers();
    this.getVehicles();
    this.createInvoiceForm = this.fb.group({
      invoiceDateStart: this.fb.control('', Validators.required),
      invoiceDateReturn: this.fb.control('', Validators.required),
      invoiceVehicle: this.fb.control('', Validators.required),
      invoiceDrivers: this.fb.array([], Validators.required),
    });

    this.driverForm = this.fb.group({
      name: this.fb.control('', Validators.required),
    });
  }

  public isDriverUsed(selectedDriver: string): boolean {
    const usedDrivers: string[] = this.drivers.value.map((item: any) => item.name);

    return usedDrivers.some((driver: string) => driver === selectedDriver);

  }

  public get drivers(): FormArray {
    return <FormArray>this.createInvoiceForm.controls.invoiceDrivers;
  }

  public getDrivers(): void {
    this.driverService
      .getDrivers()
      .pipe(
        filter((data: IDriver[]) => !!data),
        tap((data: IDriver[]) => (this.availableDrivers = data)),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();
  }

  public getVehicles(): void {
    this.driverService
      .getVehicles()
      .pipe(
        filter((data: IVehicle[]) => !!data),
        tap((data: IVehicle[]) => (this.availableVehicles = data)),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();
  }

  public setDateStart(date: string): void {
    this.createInvoiceForm.controls.invoiceDateStart.setValue(date);
  }

  public setDateReturn(date: string): void {
    this.createInvoiceForm.controls.invoiceDateReturn.setValue(date);
  }

  public addDriver(): void {
    const add: any = this.createInvoiceForm.get('invoiceDrivers') as FormArray;

    if (this.driverForm.valid) {
      add.push(this.fb.group(this.driverForm.value));
    }

    this.driverForm.reset();
  }

  public removeDriver(index: number): void {
    const remove: any = this.createInvoiceForm.get('invoiceDrivers') as FormArray;
    remove.removeAt(index);
  }

  public dismissModal(): void {
    this.modalCtrl.dismiss(null, 'dismiss');
  }

  public createInvoice(): void {
    this.handleButtonClick()
      .then(() => {
        this.invoiceService
          .createInvoice(this.createInvoiceForm.value)
          .pipe(
            take(1),
            filter((data: ICommonResponse<ICreateInvoiceResponse>) => !!data && this.createInvoiceForm.valid),
            tap((data: ICommonResponse<ICreateInvoiceResponse>) => {
              this.loadingCtrl.dismiss();
              this.modalCtrl.dismiss(data.data, 'save');
            }),
            takeUntil(this.componentDestroyed$),
          )
          .subscribe();
      })
      .catch((error: Error) => throwError(error));
  }

  public async handleButtonClick(): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingCtrl.create({
      message: 'Kreiranje Fakture...',
    });

    await loading.present();
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
