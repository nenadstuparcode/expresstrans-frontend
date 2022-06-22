import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, throwError } from 'rxjs';
import { LoadingController, ModalController, PickerController, ToastController } from '@ionic/angular';
import { BusLineService } from '@app/tab2/bus-line.service';
import { DateAdapter } from '@angular/material/core';
import { TicketService } from '@app/tab1/ticket.service';
import { catchError, filter, map, startWith, take, takeUntil, tap } from 'rxjs/operators';
import { IBusLine, IInvoice } from '@app/tab2/tab2.interface';
import { ITicket, TicketType } from '@app/tab1/ticket.interface';
import { InvoiceService } from '@app/tab2/invoice.service';
import { ICommonResponse } from '@app/services/user.interface';
import { DatetimeModalComponent } from '@app/tab1/components/datetime-modal/datetime-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-ticket-edit',
  templateUrl: './ticket-edit.component.html',
  styleUrls: ['./ticket-edit.component.scss'],
})
export class TicketEditComponent implements OnInit, OnDestroy {
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;
  @Input() ticketData: ITicket = null;
  public invoices: IInvoice[] = [];
  public editTicketForm: FormGroup;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public pickedOption: any;
  public availableDays: number[] = [];
  public daysForLine: any[] = [];
  public selectedInvoiceNumber: number;

  public busLines: IBusLine[] = [];
  public filteredBuslines: Observable<IBusLine[]>;

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
    this.dateAdapter.setLocale('cr');
  }

  public get TicketTypes(): typeof TicketType {
    return TicketType;
  }

  public get createTicketType(): TicketType {
    return this.editTicketForm.controls.ticketType.value;
  }

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
          this.busLines = [...data];
        }),
        tap(() => {
          this.selectedInvoiceNumber = this.ticketData.ticketInvoiceNumber;
          this.editTicketForm = this.fb.group({
            ticketOnName: this.fb.control(this.ticketData.ticketOnName, Validators.required),
            ticketPhone: this.fb.control(this.ticketData.ticketPhone),
            ticketEmail: this.fb.control(this.ticketData.ticketEmail),
            ticketNote: this.fb.control(this.ticketData.ticketNote),
            ticketValid: this.fb.control(this.ticketData.ticketValid, Validators.required),
            ticketDisabled: this.fb.control(this.ticketData.ticketDisabled, Validators.required),
            ticketBusLineId: this.fb.control(this.ticketData.ticketBusLineId, Validators.required),
            ticketRoundTrip: this.fb.control(this.ticketData.ticketRoundTrip, Validators.required),
            ticketStartDate: this.fb.control(this.ticketData.ticketStartDate, Validators.required),
            ticketStartTime: this.fb.control(this.ticketData.ticketStartTime, Validators.required),
            ticketInvoiceNumber: this.fb.control(this.ticketData.ticketInvoiceNumber ? this.ticketData.ticketInvoiceNumber.toString() : ''),
            ticketType: this.fb.control(this.ticketData.ticketType, Validators.required),
            ticketClassicId: this.fb.control(this.ticketData.ticketClassicId),
            ticketPrice: this.fb.control(this.ticketData.ticketPrice, Validators.required),
            ticketDiscount: this.fb.control(this.ticketData.ticketDiscount, Validators.required),
          });
        }),
        tap(() => {
          this.filteredBuslines = this.editTicketForm.controls.ticketBusLineId.valueChanges.pipe(
            startWith(''),
            map((value: any) => (typeof value === 'string' ? value : value.lineCityStart)),
            map((name: string) => (name ? this._filter(name) : this.busLines.slice())),
          );
        }),
        catchError((error: Error) => throwError(error)),
      )
      .subscribe();
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
      .subscribe((result: string) => {
        if (result) {
          type === 'date' ? this.setDate(result) : this.setTime(result);
        }
      });
  }

  public setDate(date: string): void {
    this.editTicketForm.controls.ticketStartDate.setValue(date);
  }

  public setTime(time: string): void {
    this.editTicketForm.controls.ticketStartTime.setValue(time);
  }

  public dismiss(): void {
    this.modalController.dismiss();
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

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
    });

    await toast.present();
  }

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingCtrl.create({
      cssClass: 'my-custom-class',
      message: msg,
    });
    await loading.present();
  }

  public updateTicket(): void {
    if (this.editTicketForm.valid) {
      this.presentLoading('Ažuriranje karte...')
        .then(() => {
          this.ticketService
            .updateTicket(this.editTicketForm.value, this.ticketData._id)
            .pipe(
              tap((data: ICommonResponse<ITicket>) => {
                this.loadingCtrl.dismiss();
                this.presentToast('Karta uspjesno ažurirana.');
                this.modalController.dismiss(data.data, 'save');
              }),
              take(1),
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
