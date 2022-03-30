import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  LoadingController,
  ModalController,
  PickerColumnOption,
  PickerController,
  ToastController,
} from '@ionic/angular';
import { BusLineService } from '@app/tab2/bus-line.service';
import {catchError, filter, map, startWith, take, takeUntil, tap} from 'rxjs/operators';
import { Observable, Subject, throwError } from 'rxjs';
import { IBusLine, IInvoice } from '@app/tab2/tab2.interface';
import { MatDatepicker } from '@angular/material/datepicker';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { ICommonResponse } from '@app/services/user.interface';
import { TicketType } from '@app/tab1/ticket.interface';
import { InvoiceService } from '@app/tab2/invoice.service';
import { DatetimeModalComponent } from '@app/tab1/components/datetime-modal/datetime-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ReservationService } from '@app/tab4/tab4.service';
import { IReservation } from '@app/tab4/tab4.interface';

@Component({
  selector: 'app-create-reservation',
  templateUrl: './create-reservation.component.html',
  styleUrls: ['./create-reservation.component.scss'],
})
export class CreateReservationComponent implements OnInit, OnDestroy {
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;
  public createReservationForm: FormGroup;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public minDate: Date;
  public columnOptions: PickerColumnOption[] = [];
  public pickedOption: any;
  public availableDays: number[] = [];
  public daysForLine: any[] = [];

  public busLines: IBusLine[] = [];
  public filteredBuslines: Observable<IBusLine[]>;
  public invoices: IInvoice[] = [];

  constructor(
    private modalController: ModalController,
    private pickerCtrl: PickerController,
    private busLineService: BusLineService,
    private fb: FormBuilder,
    private dateAdapter: DateAdapter<Date>,
    private reservationService: ReservationService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private invoiceService: InvoiceService,
    public dialog: MatDialog,
  ) {
    this.minDate = new Date();
    this.dateAdapter.setLocale('cr');
  }

  // eslint-disable-next-line @typescript-eslint/typedef
  public myFilter = (d: Date): boolean => {
    const day: number = (d || new Date()).getDay();
    const blockedDates: number[] = [...this.availableDays];

    return blockedDates.includes(day);
  };

  public ngOnInit(): void {
    this.invoiceService
      .searchInvoices({ searchTerm: '', searchSkip: 0, searchLimit: 20 })
      .pipe(
        filter((data: ICommonResponse<IInvoice[]>) => !!data),
        tap((data: ICommonResponse<IInvoice[]>) => {
          this.invoices = data.data;
        }),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();

    this.busLineService
      .getBusLines()
      .pipe(
        filter((data: IBusLine[]) => !!data),
        takeUntil(this.componentDestroyed$),
        tap((data: IBusLine[]) => {
          this.busLines = data;
        }),
        map((data: IBusLine[]) =>
          data.map((line: IBusLine) => ({
            text: `(${line.lineCountryStart === 'bih' ? 'BIH' : 'DE'}) ${line.lineCityStart} - ${line.lineCityEnd}`,
            value: line,
          })),
        ),
        tap((data: PickerColumnOption[]) => {
          this.columnOptions = data;
          this.createReservationForm = this.fb.group({
            reservationOnName: this.fb.control('', Validators.required),
            reservationPhone: this.fb.control('', Validators.required),
            reservationDate: this.fb.control('', Validators.required),
            reservationTime: this.fb.control('', Validators.required),
            ticketBusLineId: this.fb.control('', Validators.required),
            reservationNote: this.fb.control(''),
          });
        }),
        tap(() => {
          this.filteredBuslines = this.createReservationForm.controls.ticketBusLineId.valueChanges.pipe(
            startWith(''),
            map((value: any) => (typeof value === 'string' ? value : value.lineCityStart)),
            map((name: string) => (name ? this._filter(name) : this.busLines.slice())),
          );
        }),
      )
      .subscribe();
  }

  public get TicketTypes(): typeof TicketType {
    return TicketType;
  }

  // eslint-disable-next-line @typescript-eslint/typedef
  public displayFn = (id: string): string => {
    if (id) {
      const selectedLine: IBusLine = this.busLines.find((line: IBusLine) => line._id === id);

      return selectedLine.lineCityStart + ' - ' + selectedLine.lineCityEnd;
    }
  };

  public _filter(name: string): IBusLine[] {
    const filterValue: string = name.toLowerCase();

    return this.busLines.filter((option: IBusLine) => option.lineCityStart.toLowerCase().includes(filterValue));
  }

  public dismissModal(role: string): void {
    this.modalController
      .dismiss(
        {
          dismissed: true,
        },
        role,
      )
      .catch((error: Error) => throwError(error));
  }

  public setDate(date: string): void {
    this.createReservationForm.controls.reservationDate.setValue(date);
  }

  public setTime(time: string): void {
    this.createReservationForm.controls.reservationTime.setValue(time);
  }

  public openDateModal(type: 'date' | 'time'): void {
    const dialogRef: MatDialogRef<DatetimeModalComponent> = this.dialog.open(DatetimeModalComponent, {
      height: '400px',
      width: '400px',
      data: type,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((result: any) => {
        if (result) {
          type === 'date' ? this.setDate(result) : this.setTime(result);
        }
      });
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'primary',
    });

    await toast.present();
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

  public createReservation(): void {
    if (this.createReservationForm.valid) {
      this.presentLoading('Kreiranje karte...')
        .then(() => {
          this.reservationService
            .createReservation(this.createReservationForm.value)
            .pipe(
              tap((res: ICommonResponse<IReservation>) => {
                this.loadingCtrl.dismiss();
                this.presentToast('Rezervacija uspjesno kreirana.');
                this.modalController.dismiss(res.data, 'save');
              }),
              take(1),
              catchError((error: Error) => {
                this.loadingCtrl.dismiss();

                return throwError(error);
              }),
            )
            .subscribe();
        })
        .catch((error: Error) => {
          this.loadingCtrl.dismiss();

          return throwError(error);
        });
    }
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
