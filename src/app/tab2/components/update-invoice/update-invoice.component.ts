import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ModalController } from '@ionic/angular';
import { filter, take, takeUntil, tap } from 'rxjs/operators';
import { ICommonResponse } from '@app/services/user.interface';
import { ICreateInvoiceResponse, IDriver, IInvoice, IVehicle } from '@app/tab2/tab2.interface';
import { combineLatest, Subject, throwError } from 'rxjs';
import { InvoiceService } from '@app/tab2/invoice.service';
import { DriverService } from '@app/tab2/driver.service';

@Component({
  selector: 'app-invoice-update',
  templateUrl: './update-invoice.component.html',
  styleUrls: ['./update-invoice.component.scss'],
})
export class UpdateInvoiceComponent implements OnInit, OnDestroy {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public updateInvoiceForm: FormGroup;
  public invoiceData: IInvoice;
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
    combineLatest([this.driverService.getDrivers(), this.driverService.getVehicles()])
      .pipe(
        filter(([drivers, vehicles]: [IDriver[], IVehicle[]]) => !!drivers && !!vehicles),
        tap(([drivers, vehicles]: [IDriver[], IVehicle[]]) => {
          this.availableDrivers = drivers;
          this.availableVehicles = vehicles;
        }),
        tap(() => {
          this.updateInvoiceForm = this.initiateUpdateForm(this.invoiceData);
        }),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();

    this.driverForm = this.fb.group({
      name: this.fb.control('', Validators.required),
    });
  }

  public initiateUpdateForm(invoice: IInvoice): FormGroup {
    return this.fb.group({
      invoiceDateStart: this.fb.control(invoice.invoiceDateStart, Validators.required),
      invoiceDateReturn: this.fb.control(invoice.invoiceDateReturn, Validators.required),
      invoiceVehicle: this.fb.control(invoice.invoiceVehicle, Validators.required),
      invoiceDrivers: this.fb.array(invoice.invoiceDrivers, Validators.required),
      invoiceNumber: this.fb.control(invoice.invoiceNumber),
    });
  }

  public isDriverUsed(selectedDriver: string): boolean {
    const usedDrivers: string[] = this.drivers.value.map((item: any) => item.name);

    return usedDrivers.some((driver: string) => driver === selectedDriver);

  }

  public get drivers(): FormArray {
    return <FormArray>this.updateInvoiceForm.controls.invoiceDrivers;
  }

  public setDateStart(date: string): void {
    this.updateInvoiceForm.controls.invoiceDateStart.setValue(date);
  }

  public setDateReturn(date: string): void {
    this.updateInvoiceForm.controls.invoiceDateReturn.setValue(date);
  }

  public addDriver(): void {
    const add: any = this.updateInvoiceForm.get('invoiceDrivers') as FormArray;

    if (this.driverForm.valid) {
      add.push(this.fb.group(this.driverForm.value));
    }

    this.driverForm.reset();
  }

  public removeDriver(index: number): void {
    const remove: any = this.updateInvoiceForm.get('invoiceDrivers') as FormArray;
    remove.removeAt(index);
  }

  public dismissModal(): void {
    this.modalCtrl.dismiss(null, 'dismiss');
  }

  public updateInvoice(): void {
    this.handleButtonClick()
      .then(() => {
        this.invoiceService
          .updateInvoice(this.updateInvoiceForm.value, this.invoiceData._id)
          .pipe(
            take(1),
            filter((data: ICommonResponse<ICreateInvoiceResponse>) => !!data && this.updateInvoiceForm.valid),
            tap((data: ICommonResponse<ICreateInvoiceResponse>) => {
              this.loadingCtrl.dismiss();
              this.modalCtrl.dismiss(data.data, 'update');
            }),
            takeUntil(this.componentDestroyed$),
          )
          .subscribe();
      })
      .catch((error: Error) => throwError(error));
  }

  public async handleButtonClick(): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingCtrl.create({
      message: 'Azuriranje Fakture...',
    });

    await loading.present();
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
