import {Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IBusLine } from '@app/tab2/tab2.interface';
import { BusLineService } from '@app/tab2/bus-line.service';
import {catchError, concatMap, filter, map, startWith, take, tap} from 'rxjs/operators';
import {Observable, Subject, throwError} from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DatetimeModalComponent } from '@app/tab1/components/datetime-modal/datetime-modal.component';
import { ReservationService } from '@app/tab4/tab4.service';
import { ICommonResponse } from '@app/services/user.interface';
import { IReservation } from '@app/tab4/tab4.interface';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import {ICreateTicketResponse, ITicket, TicketType} from '@app/tab1/ticket.interface';
import { TicketEditComponent } from '@app/tab1/components/ticket-edit/ticket-edit.component';
import { TicketService } from '@app/tab1/ticket.service';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss'],
})
export class ReservationsComponent implements OnInit, OnDestroy {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public searchBarForm: FormGroup;
  public reservationForm: FormGroup;
  public reservations: IReservation[] = [];
  public searchRangeForm: FormGroup;
  public ticketsForm: FormGroup;
  public tickets: ITicket[] = [];
  public filteredBuslines: Observable<IBusLine[]>;
  public campaignOne: FormGroup;
  public currentYear: number;

  public months: any[] = [
    {
      name: 'Januar',
      code: 0,
    },
    {
      name: 'Februar',
      code: 1,
    },
    {
      name: 'Mart',
      code: 2,
    },
    {
      name: 'April',
      code: 3,
    },
    {
      name: 'Maj',
      code: 4,
    },
    {
      name: 'Jun',
      code: 5,
    },
    {
      name: 'Jul',
      code: 6,
    },
    {
      name: 'August',
      code: 7,
    },
    {
      name: 'Septembar',
      code: 8,
    },
    {
      name: 'Oktobar',
      code: 9,
    },
    {
      name: 'Novembar',
      code: 10,
    },
    {
      name: 'Decembar',
      code: 11,
    },
  ];

  public monthsToShow: any[] = [];

  public buslines: IBusLine[] = [];
  public displayedColumns: string[] = [
    'position',
    'ticketIdToShow',
    'ticketStartDate',
    'ticketStartTime',
    'ticketOnName',
    'ticketPhone',
    'ticketNote',
    'ticketRoundTrip',
    'busLineData',
    'ticketPrice',
    'actions',
  ];

  public activeLink: number;

  constructor(
    private ticketService: TicketService,
    private fb: FormBuilder,
    private buslineService: BusLineService,
    private dialog: MatDialog,
    private reservationService: ReservationService,
    private loadingController: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
  ) {}

  public ngOnInit(): void {
    this.getData();
  }

  public get TicketTypes(): typeof TicketType {
    return TicketType;
  }

  public generateMonths(currentMonth: number, year: number): void {
    const monthsToShow: any[] = [];

    this.months.forEach((month: any) => {
      if (month.code >= currentMonth && month.code <= 11) {
        monthsToShow.push({ ...month, year: year });
      }
    });

    this.months.forEach((month: any) => {
      if (month.code < currentMonth && month.code <= 11) {
        monthsToShow.push({ ...month, year: year + 1 });
      }
    });

    this.monthsToShow = [...monthsToShow];
  }

  public loadPrevious(year: number): void {
    const today: Date = new Date();
    const month: number = today.getMonth();
    this.generateMonths(month, year - 1);
    this.goToMonth(month, year - 1);
  }

  public loadNext(year: number): void {
    const today: Date = new Date();
    const month: number = today.getMonth();
    this.generateMonths(month, year + 1);
    this.goToMonth(month, year + 1);
  }

  public goToMonth(month: number, yearToGo: number): void {
    this.campaignOne.controls.start.setValue(new Date(yearToGo, month, 1).toISOString());
    this.campaignOne.controls.end.setValue(new Date(yearToGo, month + 1, 1).toISOString());
    this.activeLink = month;
    this.currentYear = yearToGo;
    this.ticketsForm.controls.ticketStartDate.setValue(new Date(yearToGo, month, 1).toISOString());

    this.getReservation();
  }

  public initializeRangePicker(): void {
    const today: Date = new Date();
    const month: number = today.getMonth();
    const year: number = today.getFullYear();
    const date: number = today.getDate();

    this.campaignOne = new FormGroup({
      start: new FormControl(new Date(year, month, date).toISOString()),
      end: new FormControl(new Date(year, month,date + 1 ).toISOString()),
    });
  }

  public getData(): void {
    this.presentLoading('Učitavanje rezervacija')
      .then(() => {
        this.buslineService
          .getBusLines()
          .pipe(
            tap((data: IBusLine[]) => {
              this.currentYear = new Date().getFullYear();
              this.generateMonths(new Date().getMonth(), new Date().getFullYear());
              this.activeLink = new Date().getMonth();
              this.initializeRangePicker();

              this.ticketsForm = this.initiateForm();

              this.searchBarForm = this.fb.group({
                searchTerm: this.fb.control(''),
              });
              this.buslines = [...data];
              this.filteredBuslines = this.ticketsForm.controls.ticketBusLineId.valueChanges.pipe(
                startWith(''),
                map((value: any) => (typeof value === 'string' ? value : value.lineCityStart)),
                map((name: string) => (name ? this._filter(name) : this.buslines.slice())),
              );
            }),
            concatMap(() =>
              this.ticketService.getTicketByType({
                searchTerm: '',
                pageNumber: 0,
                resultPerPage: 1000,
                startDate: this.campaignOne.controls.start.value,
                endDate: this.campaignOne.controls.end.value,
                sortByProp: null,
                sortOption: null,
              }),
            ),
            map((data: ICommonResponse<ITicket[]>) => {
              return data.data.map((res: ITicket) => {
                return {
                  ...res,
                  busLineData: this.getBusLineData(res.ticketBusLineId),
                };
              });
            }),
            tap((data: ITicket[]) => {
              this.tickets = data.map((ticket: ITicket, index: number) => {
                return {
                  ...ticket,
                  position: index + 1,
                };
              });
              this.loadingController.dismiss();
            }),
            catchError((error: Error) => {
              this.loadingController.dismiss();

              return throwError(error);
            }),
            take(1),
          )
          .subscribe();
      })
      .catch((error: Error) => {
        this.loadingController.dismiss();

        return throwError(error);
      });
  }

  public getReservation(): void {
    this.presentLoading('Učitavanje rezervacija')
      .then(() => {
        this.ticketService
          .getTicketByType({
            searchTerm: '',
            pageNumber: 0,
            resultPerPage: 100,
            startDate: this.campaignOne.controls.start.value,
            endDate: this.campaignOne.controls.end.value,
            sortByProp: null,
            sortOption: null,
          })
          .pipe(
            map((data: ICommonResponse<ITicket[]>) => {
              return data.data.map((res: ITicket) => {
                return {
                  ...res,
                  busLineData: this.getBusLineData(res.ticketBusLineId),
                };
              });
            }),
            tap((data: ITicket[]) => {
              this.tickets = data.map((ticket: ITicket, index: number) => {
                return {
                  ...ticket,
                  position: index + 1,
                };
              });
              this.loadingController.dismiss();
            }),
            catchError((error: Error) => {
              this.loadingController.dismiss();

              return throwError(error);
            }),
            take(1),
          )
          .subscribe();
      })
      .catch((error: Error) => {
        this.loadingController.dismiss();

        return throwError(error);
      });
  }

  public initiateForm(): FormGroup {
    return this.fb.group({
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
  }

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingController.create({ message: msg });
    await loading.present();
  }

  public getBusLineData(busLineId: string): IBusLine {
    return this.buslines.find((line: IBusLine) => line._id === busLineId);
  }

  // eslint-disable-next-line @typescript-eslint/typedef
  public displayFnDe = (id: string): string => {
    if (id) {
      const selectedLine: IBusLine = this.buslines.find((line: IBusLine) => line._id === id);

      return selectedLine.lineCityStart + ' - ' + selectedLine.lineCityEnd;
    }
  };

  public _filter(name: string): IBusLine[] {
    const filterValue: string = name.toLowerCase();

    return this.buslines.filter((option: IBusLine) => option.lineCityStart.toLowerCase().includes(filterValue));
  }

  public setDate(date: string): void {
    this.ticketsForm.controls.ticketStartDate.setValue(date);
  }

  public setTime(time: string): void {
    this.ticketsForm.controls.ticketStartTime.setValue(time);
  }

  public openDateModal(type: 'date' | 'time'): void {
    const dialogRef: MatDialogRef<DatetimeModalComponent> = this.dialog.open(DatetimeModalComponent, {
      height: '400px',
      width: '400px',
      data: type,
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result: any) => {
        if (result) {
          type === 'date' ? this.setDate(result) : this.setTime(result);
        }
      });
  }

  public async editTicket(ticket: ITicket): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: TicketEditComponent,
      componentProps: {
        ticketData: ticket,
      },
    });

    modal.onDidDismiss().then(() => {
      this.getReservation();
    });

    return await modal.present();
  }

  public disableTicket(ticket: ITicket): void {
    this.presentLoading('Storniranje karte').then(() => {
      this.ticketService.updateTicket({ ...ticket, ticketDisabled: true}, ticket._id).pipe(
        tap(() => {
          this.loadingController.dismiss();
          this.getReservation();
        }),
        catchError((err: Error) => {
          this.loadingController.dismiss();

          return throwError(err);
        }),
        take(1),
      ).subscribe()
    }).catch((err: Error) => {
      this.loadingController.dismiss();

      return throwError(err);
    });
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

  public createTicket(form: FormGroup): void {
    if (form.valid) {
      this.presentLoading('Kreiranje karte...')
        .then(() => {
          this.ticketService
            .createTicket(form.value)
            .pipe(
              tap((res: ICommonResponse<ICreateTicketResponse>) => {

                this.loadingController.dismiss();

                const newTicket: ITicket = {
                  ...res.data,
                  busLineData: this.getBusLineData(res.data.ticketBusLineId),
                  ticketIdToShow:
                    res.data.ticketType === 'classic' ? `No.0${res.data.ticketClassicId}` : res.data.ticketId,
                };

                this.tickets = [...this.tickets, newTicket]

                this.ticketsForm = this.initiateForm();
                this.getReservation();
              }),
              take(1),
              catchError((error: Error) => {
                this.loadingController.dismiss();

                return throwError(error);
              }),
            )
            .subscribe();
        })
        .catch((error: Error) => {
          this.loadingController.dismiss();

          return throwError(error);
        });
    }
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
              this.getReservation();
              this.loadingController.dismiss();
            }),
            catchError((error: Error) => {
              this.loadingController.dismiss();

              return throwError(error);
            }),
            take(1),
          )
          .subscribe();
      })
      .catch((error: Error) => {
        this.loadingController.dismiss();

        return throwError(error);
      });
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
