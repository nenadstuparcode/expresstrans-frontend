import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  LoadingController,
  ModalController,
  PickerController,
  ToastController,
} from '@ionic/angular';
import { BusLineService } from '@app/tab2/bus-line.service';
import { catchError, map, startWith, take, takeUntil, tap } from 'rxjs/operators';
import { Observable, Subject, throwError } from 'rxjs';
import { IBusLine, IInvoice } from '@app/tab2/tab2.interface';
import { MatDatepicker } from '@angular/material/datepicker';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { TicketService } from '@app/tab1/ticket.service';
import { ICommonResponse } from '@app/services/user.interface';
import { ICreateTicketResponse, TicketType } from '@app/tab1/ticket.interface';
import { InvoiceService } from '@app/tab2/invoice.service';
import { DatetimeModalComponent } from '@app/tab1/components/datetime-modal/datetime-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-ticket',
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.scss'],
})
export class CreateTicketComponent implements OnInit, OnDestroy {
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;
  public createTicketForm: FormGroup;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public minDate: Date;
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
    private ticketService: TicketService,
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
        tap((data: ICommonResponse<IInvoice[]>) => {
          this.invoices = data.data;
        }),
        takeUntil(this.componentDestroyed$),
        catchError((error: Error) => throwError(error)),
      )
      .subscribe();

    this.busLineService
      .getBusLines()
      .pipe(
        takeUntil(this.componentDestroyed$),
        tap((data: IBusLine[]) => {
          this.busLines = data;
        }),
        tap(() => {
          this.createTicketForm = this.fb.group({
            ticketOnName: this.fb.control('', Validators.required),
            ticketPhone: this.fb.control(''),
            ticketEmail: this.fb.control(''),
            ticketNote: this.fb.control(''),
            ticketType: this.fb.control('internet', Validators.required),
            ticketValid: this.fb.control('6', Validators.required),
            ticketBusLineId: this.fb.control('', Validators.required),
            ticketRoundTrip: this.fb.control(false, Validators.required),
            ticketStartDate: this.fb.control('', Validators.required),
            ticketStartTime: this.fb.control('', Validators.required),
            ticketInvoiceNumber: this.fb.control(''),
            ticketClassicId: this.fb.control(''),
            ticketPrice: this.fb.control(0, Validators.required),
          });
        }),
        tap(() => {
          this.filteredBuslines = this.createTicketForm.controls.ticketBusLineId.valueChanges.pipe(
            startWith(''),
            map((value: any) => (typeof value === 'string' ? value : value.lineCityStart)),
            map((name: string) => (name ? this._filter(name) : this.busLines.slice())),
          );
        }),
        catchError((error: Error) => throwError(error)),
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

  public get createTicketType(): TicketType {
    return this.createTicketForm.controls.ticketType.value;
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
    this.createTicketForm.controls.ticketStartDate.setValue(date);
  }

  public setTime(time: string): void {
    this.createTicketForm.controls.ticketStartTime.setValue(time);
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

  public handleBusLine(selectedLine: any): void {
    this.pickedOption = selectedLine;
    this.availableDays = selectedLine.linija.value.lineArray.map((line: any) => line.day);
    this.daysForLine = selectedLine.linija.value.lineArray;

    this.createTicketForm.controls.ticketBusLineId.setValue(selectedLine.linija.value._id);
    this.createTicketForm.controls.ticketStartDate.setValue('');
    this.createTicketForm.controls.ticketStartTime.setValue('');
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
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

  public createTicket(): void {
    if (this.createTicketForm.valid) {
      this.presentLoading('Kreiranje karte...')
        .then(() => {
          this.ticketService
            .createTicket(this.createTicketForm.value)
            .pipe(
              tap((res: ICommonResponse<ICreateTicketResponse>) => {
                this.loadingCtrl.dismiss();
                this.presentToast('Karta uspjesno kreirana.');
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
