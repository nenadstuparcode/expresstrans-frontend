import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, throwError } from 'rxjs';
import {
  LoadingController,
  ModalController,
  PickerColumn,
  PickerColumnOption,
  PickerController,
  ToastController,
} from '@ionic/angular';
import { BusLineService } from '@app/tab2/bus-line.service';
import { DateAdapter } from '@angular/material/core';
import { TicketService } from '@app/tab1/ticket.service';
import { filter, finalize, map, startWith, takeUntil, tap } from 'rxjs/operators';
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
export class TicketEditComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;
  @Input() ticketData: ITicket = null;
  public invoices: IInvoice[] = [];
  public editTicketForm: FormGroup;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public columnOptions: PickerColumnOption[] = [];
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

  public ngAfterViewInit(): void {
    this.busLineService
      .getBusLines()
      .pipe(
        tap((data: IBusLine[]) => {
          // eslint-disable-next-line no-underscore-dangle
          const selectedLine: IBusLine[] = data.filter(
            (line: IBusLine) => line._id === this.ticketData.ticketBusLineId,
          );

          this.pickedOption = {
            linija: {
              // eslint-disable-next-line max-len
              text: `(${selectedLine[0].lineCountryStart === 'bih' ? 'BIH' : 'DE'}) ${
                selectedLine[0].lineCityStart
              } - ${selectedLine[0].lineCityEnd}`,
              value: selectedLine[0],
            },
          };
        }),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();
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
          this.selectedInvoiceNumber = this.ticketData.ticketInvoiceNumber;
          this.editTicketForm = this.fb.group({
            ticketOnName: this.fb.control(this.ticketData.ticketOnName, Validators.required),
            ticketPhone: this.fb.control(this.ticketData.ticketPhone, Validators.required),
            ticketEmail: this.fb.control(this.ticketData.ticketEmail, Validators.required),
            ticketNote: this.fb.control(this.ticketData.ticketNote),
            ticketValid: this.fb.control(this.ticketData.ticketValid, Validators.required),
            ticketBusLineId: this.fb.control(this.ticketData.ticketBusLineId, Validators.required),
            ticketRoundTrip: this.fb.control(this.ticketData.ticketRoundTrip, Validators.required),
            ticketStartDate: this.fb.control(this.ticketData.ticketStartDate, Validators.required),
            ticketStartTime: this.fb.control(this.ticketData.ticketStartTime, Validators.required),
            ticketInvoiceNumber: this.fb.control(this.ticketData.ticketInvoiceNumber.toString(), Validators.required),
            ticketType: this.fb.control(this.ticketData.ticketType, Validators.required),
            ticketClassicId: this.fb.control(this.ticketData.ticketClassicId),
            ticketPrice: this.fb.control(this.ticketData.ticketPrice, Validators.required),
          });
        }),
        tap(() => {
          this.filteredBuslines = this.editTicketForm.controls.ticketBusLineId.valueChanges.pipe(
            startWith(''),
            map((value: any) => (typeof value === 'string' ? value : value.lineCityStart)),
            map((name: string) => (name ? this._filter(name) : this.busLines.slice())),
          );
        }),
        //TODO remove subscribe from watchTicketPrice fucntion
        tap(() => this.watchTicketPrice()),
      )
      .subscribe();
  }

  public watchTicketPrice(): void {
    this.editTicketForm.controls.ticketBusLineId.valueChanges
      .pipe(
        tap((data: any) => this.setTicketPrice(data, this.editTicketForm.controls.ticketRoundTrip.value)),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();

    this.editTicketForm.controls.ticketRoundTrip.valueChanges
      .pipe(
        tap((data: any) => this.setTicketPrice(this.editTicketForm.controls.ticketBusLineId.value, data)),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();
  }

  public setTicketPrice(buslineId: string, roundTrip: boolean): void {
    // eslint-disable-next-line no-underscore-dangle
    const busLine: IBusLine = this.busLines.find((line: IBusLine) => line._id === buslineId);
    let price: number;

    if (busLine) {
      price = roundTrip ? busLine.linePriceRoundTrip : busLine.linePriceOneWay;
    } else {
      price = 0;
    }

    this.editTicketForm.controls.ticketPrice.setValue(price);
  }

  public setInvoiceNumber(num: any): void {
    this.editTicketForm.controls.ticketInvoiceNumber.setValue(num);
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

  public getColumns(): PickerColumn[] {
    const options: PickerColumn = {
      name: 'linija',
      selectedIndex: 0,
      options: [...this.columnOptions],
    };

    return [options];
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

  public handleBusLine(selectedLine: any): void {
    this.pickedOption = selectedLine;
    this.availableDays = selectedLine.linija.value.lineArray.map((line: any) => line.day);
    this.daysForLine = selectedLine.linija.value.lineArray;
    // eslint-disable-next-line no-underscore-dangle
    this.editTicketForm.controls.ticketBusLineId.setValue(selectedLine.linija.value._id);
    this.editTicketForm.controls.ticketStartDate.setValue('');
    this.editTicketForm.controls.ticketStartTime.setValue('');
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
              finalize(() => {
                this.loadingCtrl.dismiss();
                this.presentToast('Karta uspjesno ažurirana.');
                this.dismissModal('dismiss');
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
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
