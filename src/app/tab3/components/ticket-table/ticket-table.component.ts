import { Component, OnDestroy, OnInit } from '@angular/core';
import { InvoiceService } from '@app/tab2/invoice.service';
import {
  catchError,
  concatMap,
  filter,
  map,
  startWith,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { ICommonResponse } from '@app/services/user.interface';
import { IBusLine, IDriver, IInvoice, IPrintInvoiceTaxPayload } from '@app/tab2/tab2.interface';
import { TicketService } from '@app/tab1/ticket.service';
import { ICreateTicketResponse, ITicket, TicketType } from '@app/tab1/ticket.interface';
import { combineLatest, Observable, Subject, throwError } from 'rxjs';
import { BusLineService } from '@app/tab2/bus-line.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ModalController, Platform, ToastController } from '@ionic/angular';
import { CreateInvoiceComponent } from '@app/tab2/components/create-invoice/create-invoice.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DatetimeModalComponent } from '@app/tab1/components/datetime-modal/datetime-modal.component';
import { TicketEditComponent } from '@app/tab1/components/ticket-edit/ticket-edit.component';
import { File } from '@ionic-native/file';
import { FileOpener } from '@ionic-native/file-opener';
import { saveAs } from 'file-saver';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-ticket-table',
  templateUrl: './ticket-table.component.html',
  styleUrls: ['./ticket-table.component.scss'],
})
export class TicketTableComponent implements OnInit, OnDestroy {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public bihImage: string = 'assets/images/bih.png';
  public deImage: string = 'assets/images/germany.png';
  public filteredBuslinesBih: Observable<IBusLine[]>;
  public filteredBuslinesDe: Observable<IBusLine[]>;
  public oneWayForm: FormGroup;
  public returnForm: FormGroup;
  public currentInvoice: IInvoice;
  public totalKilometers: number = 0;
  public bihKilometers: number = 0;
  public needUpdate: boolean = false;
  public needUpdateTax: boolean = false;
  public needUpdateExpenses: boolean = false;
  public ticketTime: Date = new Date();
  public displayedColumns: string[] = [
    'position',
    'ticketInvoiceNumber',
    'ticketIdToShow',
    'ticketStartDate',
    'ticketOnName',
    'ticketRoundTrip',
    'busLineData',
    'ticketPrice',
    'actions',
  ];

  public expensesColumns: string[] = [
    'expCroatia',
    'expSlovenia',
    'expAustria',
    'expGermany',
    'expInitially',
    'billed',
    'expInCountries',
    'expUnexpected',
    'totalBilling',
  ];

  public taxBihColumns: string[] = [
    'totalKilometers',
    'totalKilometersBih',
    'diffKilometers',
    'firstCalculation',
    'secondCalculation',
    'returnTaxBih',
    'action',
  ];

  public daynames: string[] = ['Nedelja', 'Ponedeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota'];

  public active: number = 1;
  public invoices: IInvoice[] = [];
  public tickets: ITicket[] = [];
  public ticketsReturn: ITicket[] = [];
  public ticketsOneWay: ITicket[] = [];
  public buslines: IBusLine[] = [];
  public buslinesDe: IBusLine[] = [];
  public buslinesBih: IBusLine[] = [];
  public activeLink: number;
  public totalPriceBih: number = 0;
  public totalPriceDe: number = 0;
  public pageLimit: number = 10;
  public pageSkip: number = 0;
  public isTicketIdClassicDisabled: boolean = false;
  public expensesForm: FormGroup;
  public taxForm: FormGroup;
  public printWithGratis: boolean = false;
  public printWithAgency: boolean = false;

  public constructor(
    private buslineService: BusLineService,
    private invoiceService: InvoiceService,
    private ticketService: TicketService,
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    public dialog: MatDialog,
    public alertCtrl: AlertController,
    private platform: Platform,
    private datePipe: DatePipe,
  ) {}

  public ngOnInit(): void {
    this.getInvoices('', this.pageLimit, this.pageSkip, null);
    this.needUpdate = true;
    this.needUpdateExpenses = true;
    this.needUpdateTax = true;
  }

  public setPrintWithGratis(): void {
    this.printWithGratis = !this.printWithGratis;
  }

  public setPrintWithAgency(): void {
    this.printWithAgency = !this.printWithAgency;
  }

  public getPercentage(): number {
    return +(this.taxForm.controls.bihKilometers.value / this.taxForm.controls.totalKilometers.value).toFixed(2);
  }

  public _filterDe(name: string): IBusLine[] {
    const filterValue: string = name.toLowerCase();

    return this.buslinesDe.filter((option: IBusLine) => option.lineCityStart.toLowerCase().includes(filterValue));
  }

  public _filterBih(name: string): IBusLine[] {
    const filterValue: string = name.toLowerCase();

    return this.buslinesBih.filter((option: IBusLine) => option.lineCityStart.toLowerCase().includes(filterValue));
  }

  public get TicketTypes(): typeof TicketType {
    return TicketType;
  }

  // eslint-disable-next-line @typescript-eslint/typedef
  public displayFnDe = (id: string): string => {
    if (id) {
      const selectedLine: IBusLine = this.buslinesDe.find((line: IBusLine) => line._id === id);

      return selectedLine.lineCityStart + ' - ' + selectedLine.lineCityEnd;
    }
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  public displayFnBih = (id: string): string => {
    if (id) {
      const selectedLine: IBusLine = this.buslinesBih.find((line: IBusLine) => line._id === id);

      return selectedLine.lineCityStart + ' - ' + selectedLine.lineCityEnd;
    }
  };

  public getInvoices(searchTerm: string, searchLimit: number, searchSkip: number, invoiceNr?: number): void {
    this.presentLoading('Ucitavanje Fakture')
      .then(() => {
        combineLatest([
          this.invoiceService.searchInvoices({ searchTerm, searchLimit, searchSkip }),
          this.buslineService.getBusLines(),
        ])
          .pipe(
            map(([data, buslines]: [ICommonResponse<IInvoice[]>, IBusLine[]]) => {
              this.invoices = data.data.map((inv: IInvoice) => {
                return {
                  ...inv,
                  driversArray: inv.invoiceDrivers ? inv.invoiceDrivers.map((driver: IDriver) => driver?.name).join(',') : '',
                };
              });
              this.buslines = buslines;
              this.buslinesDe = buslines.filter((bus: IBusLine) => bus.lineCountryStart === 'de');
              this.buslinesBih = buslines.filter((bus: IBusLine) => bus.lineCountryStart === 'bih');

              if (!invoiceNr) {
                this.currentInvoice = this.invoices[0];
                this.activeLink = this.invoices[0].invoiceNumber;
              } else {
                this.activeLink = invoiceNr;
                this.currentInvoice = this.invoices.find((invoice: IInvoice) => invoice.invoiceNumber === invoiceNr);
              }

              return this.activeLink;
            }),
            concatMap((invoiceNr: number) => this.ticketService.getTicketsByInvoice(invoiceNr)),
            map((response: ICommonResponse<ITicket[]>) => {
              return response.data.map((ticket: ITicket) => {
                return {
                  ...ticket,
                  busLineData: this.getBusLineData(ticket.ticketBusLineId),
                  ticketIdToShow: ticket.ticketType === 'internet' ? ticket.ticketId : `No.0${ticket.ticketClassicId}`,
                };
              });
            }),
            map((tickets: ITicket[]) => {
              this.expensesForm = this.initiateExpensesForm(this.currentInvoice);
              this.oneWayForm = this.initiateForm(true);
              this.returnForm = this.initiateForm(false);
              this.taxForm = this.initiateTaxForm();
              this.tickets = [...tickets];
              this.ticketsOneWay = [
                ...tickets
                  .filter((ticket: ITicket) => ticket.busLineData.lineCountryStart === 'bih')
                  .map((ticket: ITicket, index: number) => {
                    return {
                      ...ticket,
                      position: index + 1,
                    };
                  }),
              ];

              this.ticketsReturn = [
                ...tickets
                  .filter((ticket: ITicket) => ticket.busLineData.lineCountryStart === 'de')
                  .map((ticket: ITicket, index: number) => {
                    return {
                      ...ticket,
                      position: index + 1,
                    };
                  }),
              ];

              this.totalPriceBih = this.calculateTotalPrice(this.ticketsOneWay);
              this.totalPriceDe = this.calculateTotalPrice(this.ticketsReturn);

              this.filteredBuslinesBih = this.oneWayForm.controls.ticketBusLineId.valueChanges.pipe(
                startWith(''),
                map((value: any) => (typeof value === 'string' ? value : value.lineCityStart)),
                map((name: string) => (name ? this._filterBih(name) : this.buslinesBih.slice())),
              );

              this.filteredBuslinesDe = this.returnForm.controls.ticketBusLineId.valueChanges.pipe(
                startWith(''),
                map((value: any) => (typeof value === 'string' ? value : value.lineCityStart)),
                map((name: string) => (name ? this._filterDe(name) : this.buslinesDe.slice())),
              );
            }),
            tap(() => {
              this.listenTaxForm();
              this.loadingCtrl.dismiss();
            }),
            catchError((error: Error) => {
              this.loadingCtrl.dismiss();

              return throwError(error);
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

  public getDayName(date: string): string {
    return this.daynames[new Date(date).getDay()];
  }

  public updateTaxMaunaly(): void {
    this.taxForm.controls.diffKilometers.setValue(
      +(this.taxForm.controls.bihKilometers.value / this.taxForm.controls.totalKilometers.value).toFixed(3),
    );
    this.taxForm.controls.firstCalculation.setValue(this.getTotalTaxBih());
    this.taxForm.controls.secondCalculation.setValue(this.getDefaultTaxBih());
    this.taxForm.controls.returnTaxBih.setValue(this.taxReturnBih());

    this.taxForm.controls.diffKilometers.setValue(
      +(this.taxForm.controls.bihKilometers.value / this.taxForm.controls.totalKilometers.value).toFixed(3),
    );
    this.taxForm.controls.firstCalculation.setValue(this.getTotalTaxBih());
    this.taxForm.controls.secondCalculation.setValue(this.getDefaultTaxBih());
    this.taxForm.controls.returnTaxBih.setValue(this.taxReturnBih());
  }

  public listenTaxForm(): void {
    this.taxForm.controls.bihKilometers.valueChanges
      .pipe(
        filter((bih: number) => !!bih),
        tap((bih: number) => {
          this.taxForm.controls.diffKilometers.setValue(
            +(bih / this.taxForm.controls.totalKilometers.value).toFixed(3),
          );
          this.taxForm.controls.firstCalculation.setValue(this.getTotalTaxBih());
          this.taxForm.controls.secondCalculation.setValue(this.getDefaultTaxBih());
          this.taxForm.controls.returnTaxBih.setValue(this.taxReturnBih());
        }),
      )
      .subscribe();

    this.taxForm.controls.totalKilometers.valueChanges
      .pipe(
        filter((total: number) => !!total),
        tap((total: number) => {
          this.taxForm.controls.diffKilometers.setValue(
            +(this.taxForm.controls.bihKilometers.value / total).toFixed(3),
          );
          this.taxForm.controls.firstCalculation.setValue(this.getTotalTaxBih());
          this.taxForm.controls.secondCalculation.setValue(this.getDefaultTaxBih());
          this.taxForm.controls.returnTaxBih.setValue(this.taxReturnBih());
        }),
      )
      .subscribe();
  }

  public initiateExpensesForm(invoice: IInvoice): FormGroup {
    return this.fb.group({
      invoiceExpCro: this.fb.control(invoice.invoiceExpCro, Validators.required),
      invoiceExpAus: this.fb.control(invoice.invoiceExpAus, Validators.required),
      invoiceExpSlo: this.fb.control(invoice.invoiceExpSlo, Validators.required),
      invoiceExpGer: this.fb.control(invoice.invoiceExpGer, Validators.required),
      invoiceInitialExpenses: this.fb.control(invoice.invoiceInitialExpenses, Validators.required),
      invoiceUnexpectedExpenses: this.fb.control(invoice.invoiceUnexpectedExpenses, Validators.required),
      invoiceUnexpectedExpensesDesc: this.fb.control(invoice.invoiceUnexpectedExpensesDesc),
      invoiceInitialExpensesDesc: this.fb.control(invoice.invoiceInitialExpensesDesc),
      invoiceTotalBill: this.fb.control(invoice.invoiceTotalBill, Validators.required),
      invoiceDrivers: this.fb.control(invoice.invoiceDrivers ? invoice.invoiceDrivers : []),
    });
  }

  public calculateTotalCountryExpenses(): number {
    return (
      this.expensesForm.controls['invoiceExpCro'].value +
      this.expensesForm.controls['invoiceExpSlo'].value +
      this.expensesForm.controls['invoiceExpAus'].value +
      this.expensesForm.controls['invoiceExpGer'].value
    );
  }

  public calculateTotal(): number {
    return +(this.calculateTotalPrice(this.tickets) * 1.95583).toFixed(2);
  }

  public calculateBilling(): number {
    return +(
      this.calculateTotalPrice(this.tickets) -
      this.calculateTotalCountryExpenses() -
      this.expensesForm.controls.invoiceUnexpectedExpenses.value
    );
  }

  public calculateBillingKM(): number {
    return +(this.calculateBilling() * 1.95583).toFixed(2);
  }

  public getTotalTaxBih(): number {
    return +(
      +(this.calculateTotalPrice(this.tickets) * 1.95583) *
      +(this.taxForm.controls.bihKilometers.value / this.taxForm.controls.totalKilometers.value)
    ).toFixed(2);
  }

  public getDefaultTaxBih(): number {
    return +(
      +(
        +(this.calculateTotalPrice(this.tickets) * 1.95583) *
        +(this.taxForm.controls.bihKilometers.value / this.taxForm.controls.totalKilometers.value)
      ) / 1.17
    ).toFixed(2);
  }

  public taxReturnBih(): number {
    return +(
      +(
        +(this.calculateTotalPrice(this.tickets) * 1.95583) *
        +(this.taxForm.controls.bihKilometers.value / this.taxForm.controls.totalKilometers.value)
      ) -
      +(
        +(
          +(this.calculateTotalPrice(this.tickets) * 1.95583) *
          +(this.taxForm.controls.bihKilometers.value / this.taxForm.controls.totalKilometers.value)
        ) / 1.17
      )
    ).toFixed(2);
  }

  public calculateTotalPrice(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      sum += ticket.ticketPrice;
    });

    return +sum.toFixed(2);
  }

  public initiateTaxForm(): FormGroup {
    return this.fb.group({
      totalKilometers: this.fb.control(
        this.currentInvoice.totalKilometers ? this.currentInvoice.totalKilometers : 0,
        Validators.required,
      ),
      bihKilometers: this.fb.control(
        this.currentInvoice.bihKilometers ? this.currentInvoice.bihKilometers : 0,
        Validators.required,
      ),
      diffKilometers: this.fb.control(
        this.currentInvoice.diffKilometers ? this.currentInvoice.diffKilometers : 0,
        Validators.required,
      ),
      firstCalculation: this.fb.control(
        this.currentInvoice.firstCalculation ? this.currentInvoice.firstCalculation : 0,
        Validators.required,
      ),
      secondCalculation: this.fb.control(
        this.currentInvoice.secondCalculation ? this.currentInvoice.secondCalculation : 0,
        Validators.required,
      ),
      returnTaxBih: this.fb.control(
        this.currentInvoice.returnTaxBih ? this.currentInvoice.returnTaxBih : 0,
        Validators.required,
      ),
      invoiceDrivers: this.fb.control(this.currentInvoice.invoiceDrivers ? this.currentInvoice.invoiceDrivers : []),
    });
  }

  public initiateForm(fromBih: boolean): FormGroup {
    return this.fb.group({
      ticketOnName: this.fb.control('', Validators.required),
      ticketPhone: this.fb.control(''),
      ticketEmail: this.fb.control(''),
      ticketNote: this.fb.control(''),
      ticketType: this.fb.control('classic', Validators.required),
      ticketValid: this.fb.control('6', Validators.required),
      ticketBusLineId: this.fb.control('', Validators.required),
      ticketRoundTrip: this.fb.control(false, Validators.required),
      ticketStartDate: this.fb.control(fromBih ? this.currentInvoice.invoiceDateStart : this.currentInvoice.invoiceDateReturn, Validators.required),
      ticketStartTime: this.fb.control(this.ticketTime, Validators.required),
      ticketInvoiceNumber: this.fb.control(this.activeLink, Validators.required),
      ticketInvoicePublicId: this.fb.control(this.currentInvoice.invoicePublicId),
      ticketClassicId: this.fb.control(''),
      ticketPrice: this.fb.control(0, Validators.required),
    });
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

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color: 'primary',
    });

    await toast.present();
  }

  public createTicket(form: FormGroup, returnTicket: boolean): void {
    if (form.valid) {
      this.presentLoading('Kreiranje karte...')
        .then(() => {
          this.ticketService
            .createTicket(form.value)
            .pipe(
              tap((res: ICommonResponse<ICreateTicketResponse>) => {
                this.presentToast('Karta uspjesno kreirana.');
                this.needUpdate = true;
                this.needUpdateExpenses = true;
                this.needUpdateTax = true;
                this.loadingCtrl.dismiss();

                const newTicket: ITicket = {
                  ...res.data,
                  busLineData: this.getBusLineData(res.data.ticketBusLineId),
                  ticketIdToShow:
                    res.data.ticketType === 'classic' ? `No.0${res.data.ticketClassicId}` : res.data.ticketId,
                };

                returnTicket ?
                  (this.ticketsReturn = [...this.ticketsReturn, newTicket]) :
                  (this.ticketsOneWay = [...this.ticketsOneWay, newTicket]);

                this.oneWayForm = this.initiateForm(true);
                this.returnForm = this.initiateForm(false);
                this.getInvoices('', this.pageLimit, this.pageSkip, this.activeLink);
              }),
              takeUntil(this.componentDestroyed$),
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

  public setDate(date: string, returnTicket: boolean): void {
    returnTicket ?
      this.returnForm.controls.ticketStartTime.setValue(date) :
      this.oneWayForm.controls.ticketStartTime.setValue(date);
  }

  public setTime(time: string, returnTicket: boolean): void {
    returnTicket ?
      this.returnForm.controls.ticketStartTime.setValue(time) :
      this.oneWayForm.controls.ticketStartTime.setValue(time);
  }

  public openDateModal(type: 'date' | 'time', returnTicket: boolean): void {
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
          type === 'date' ? this.setDate(result, returnTicket) : this.setTime(result, returnTicket);
        }
      });
  }

  public updateInvoiceExpenses(): void {
    this.expensesForm.controls['invoiceTotalBill'].setValue(this.calculateBilling());
    this.presentLoading('Ažuriranje Troškova')
      .then(() => {
        this.invoiceService
          .updateInvoiceExpenses(this.expensesForm.value, this.currentInvoice?._id)
          .pipe(
            tap((data: ICommonResponse<IInvoice>) => {
              this.needUpdate = false;
              this.needUpdateExpenses = false;
              this.currentInvoice = { ...data.data };
              this.getInvoices('', this.pageLimit, this.pageSkip, this.activeLink);
              this.loadingCtrl.dismiss();
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

  public updateInvoiceTax(): void {
    this.updateTaxMaunaly();

    this.presentLoading('Ažuriranje PDV-a za BIH')
      .then(() => {
        this.invoiceService
          .updateInvoiceTax(this.taxForm.value, this.currentInvoice?._id)
          .pipe(
            tap(() => {
              this.needUpdate = false;
              this.needUpdateTax = false;
              this.getInvoices('', this.pageLimit, this.pageSkip, this.activeLink);

              this.loadingCtrl.dismiss();
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

  public getBusLineData(busLineId: string): IBusLine {
    return this.buslines.find((line: IBusLine) => line._id === busLineId);
  }

  public async createInvoice(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({ component: CreateInvoiceComponent });

    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        const newInvoice: IInvoice = data.data;
        this.invoices.unshift(newInvoice);
        this.activeLink = newInvoice.invoiceNumber;
        this.getInvoices('', 10, 0, newInvoice.invoiceNumber);
      }
    });

    return await modal.present();
  }

  public addInvoice(): void {
    this.createInvoice();
  }

  public loadInvoice(invoiceNr: number): void {
    this.activeLink = invoiceNr;
    this.getInvoices('', this.pageLimit, this.pageSkip, invoiceNr);
  }

  public loadMoreInvoices(): void {
    this.pageLimit += 10;
    this.getInvoices('', this.pageLimit, this.pageSkip, this.activeLink);
  }

  public async editTicket(ticket: ITicket): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: TicketEditComponent,
      componentProps: {
        ticketData: ticket,
      },
    });

    modal.onDidDismiss().then(() => {
      this.needUpdate = true;
      this.needUpdateExpenses = true;
      this.needUpdateTax = true;
      this.getInvoices('', this.pageLimit, this.pageSkip, this.activeLink);
    });

    return await modal.present();
  }

  public async deleteTicketModal(ticket: ITicket): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: 'Obriši Kartu?',
      message: 'Da li ste sigurni da želite da obrišete kartu?',
      buttons: [
        {
          text: 'Otkaži',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Obriši',
          handler: () => {
            this.deleteTicket(ticket);
          },
        },
      ],
    });

    await alert.present();
  }

  public deleteTicket(ticket: ITicket): void {
    this.presentLoading(`Brisanje karte na ime "${ticket.ticketOnName}" u toku...`)
      .then(() => {
        this.ticketService
          .deleteTicket(ticket._id)
          .pipe(
            filter((data: ICommonResponse<any>) => !!data),
            tap(() => {
              this.tickets = [...this.tickets.filter((ticketToDelete: ITicket) => ticketToDelete._id !== ticket._id)];
              this.needUpdate = true;
              this.needUpdateExpenses = true;
              this.needUpdateTax = true;
              this.getInvoices('', this.pageLimit, this.pageSkip, this.activeLink);
              this.loadingCtrl.dismiss();
            }),
            catchError((error: Error) => {
              this.loadingCtrl.dismiss();

              return throwError(error);
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

  public async printInvoiceModal(): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: 'Opcije printanja PDF-a',
      message: 'Izaberi opciju printanja',
      buttons: [
        {
          text: 'Otkaži',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Printaj bez troškova (PDV)',
          handler: () => {
            this.printInvoiceTax(false, true, this.printWithGratis, this.printWithAgency);
          },
        },
        {
          text: 'Printaj sa troškovima (bez PDV-a)',
          handler: () => {
            this.printInvoiceTax(true, false, this.printWithGratis, this.printWithAgency);
          },
        },
        {
          text: 'Printaj sa troškovima i PDV-om',
          handler: () => {
            this.printInvoiceTax(true, true, this.printWithGratis, this.printWithAgency);
          },
        },
        {
          text: 'Printaj samo karte',
          handler: () => {
            this.printInvoiceTax(false, false, this.printWithGratis, this.printWithAgency);
          },
        },
      ],
    });

    await alert.present();
  }

  public printInvoiceTax(withExpenses: boolean, withTax: boolean, withGratis: boolean, withAgency: boolean): void {
    this.presentLoading('Printanje izvjestaja u PDF-u...')
      .then(() => {
        const payload: IPrintInvoiceTaxPayload = {
          invoice: {
            ...this.currentInvoice,
            invoiceDateStart: this.datePipe.transform(this.currentInvoice.invoiceDateStart, 'dd/MM/YYYY'),
            invoiceDateReturn: this.datePipe.transform(this.currentInvoice.invoiceDateReturn, 'dd/MM/YYYY'),
          },
          bihTickets: this.ticketsOneWay.map((tick: ITicket) => {
            return {
              ...tick,
              ticketStartDate: this.datePipe.transform(tick.ticketStartDate, 'dd/MM/YYYY'),
              ticketStartTime: this.datePipe.transform(tick.ticketStartTime, 'HH:mm'),
            };
          }),
          deTickets: this.ticketsReturn.map((tick: ITicket) => {
            return {
              ...tick,
              ticketStartDate: this.datePipe.transform(tick.ticketStartDate, 'dd/MM/YYYY'),
              ticketStartTime: this.datePipe.transform(tick.ticketStartTime, 'HH:mm'),
            };
          }),
          expenses: this.expensesForm.value,
          tax: this.taxForm.value,
          totalPriceDe: this.totalPriceDe,
          totalPriceBih: this.totalPriceBih,
          showExpenses: withExpenses,
          showTax: withTax,
        };

        if(withGratis) {
          payload.deTickets = [...payload.deTickets.filter((ticket: ITicket) => ticket.ticketType !== TicketType.gratis)];
          payload.bihTickets = [...payload.bihTickets.filter((ticket: ITicket) => ticket.ticketType !== TicketType.gratis)];
        }

        if(withAgency) {
          payload.deTickets = [...payload.deTickets.filter((ticket: ITicket) => ticket.ticketType !== TicketType.agency)];
          payload.bihTickets = [...payload.bihTickets.filter((ticket: ITicket) => ticket.ticketType !== TicketType.agency)];
        }

        this.invoiceService
          .printInvoiceTax(payload)
          .pipe(
            tap((response: ArrayBuffer) => {
              if (this.platform.is('android') || this.platform.is('iphone')) {
                try {
                  File.writeFile(
                    File.externalRootDirectory,
                    'izvjestaj-bih.pdf',
                    new Blob([response], { type: 'application/pdf' }),
                    {
                      replace: true,
                    },
                  ).catch((error: Error) => throwError(error));

                  File.writeFile(
                    File.documentsDirectory,
                    'izvjestaj-bih.pdf',
                    new Blob([response], { type: 'application/pdf' }),
                    {
                      replace: true,
                    },
                  ).catch((error: Error) => throwError(error));

                } catch (err) {
                  throwError(err);
                }
              } else {
                const file: Blob = new Blob([response], {
                  type: 'application/pdf',
                });
                const fileURL: string = URL.createObjectURL(file);
                window.open(fileURL);
                saveAs(file, 'izvjestaj-bih.pdf');
              }
            }),
            tap(() => {
              this.loadingCtrl.dismiss();
              FileOpener.open(File.externalRootDirectory + 'izvjestaj-bih.pdf', 'application/pdf');

              this.presentToast('Štampanje završeno.');
            }),
            catchError((error: Error) => {
              this.loadingCtrl.dismiss();

              return throwError(error);
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

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
