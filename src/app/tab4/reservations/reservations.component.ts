import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IBusLine } from '@app/tab2/tab2.interface';
import { BusLineService } from '@app/tab2/bus-line.service';
import { catchError, concatMap, map, startWith, take, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DatetimeModalComponent } from '@app/tab1/components/datetime-modal/datetime-modal.component';
import { ReservationService } from '@app/tab4/tab4.service';
import { ICommonResponse } from '@app/services/user.interface';
import { IReservation } from '@app/tab4/tab4.interface';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { ConvertReservationComponent } from '@app/tab4/convert-reservation/convert-reservation.component';
import { CreateReservationComponent } from '@app/tab4/create-reservation/create-reservation.component';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss'],
})
export class ReservationsComponent implements OnInit {
  public searchBarForm: FormGroup;
  public reservationForm: FormGroup;
  public reservations: IReservation[] = [];
  public searchRangeForm: FormGroup;
  public reservationColumns: string[] = [
    'reservationOnName',
    'busLineData',
    'reservationPhone',
    'reservationDate',
    'reservationTime',
    'reservationNote',
    'action',
  ];

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
  public activeLink: number;
  constructor(
    private fb: FormBuilder,
    private buslineService: BusLineService,
    private dialog: MatDialog,
    private reservationService: ReservationService,
    private loadingController: LoadingController,
    private alertCtrl: AlertController,
    private modalController: ModalController,
  ) {}

  public ngOnInit(): void {
    this.getData();
  }

  public generateMonths(currentMonth: number, year: number): void {
    const monthsToShow: any[] = [];

    this.months.forEach((month: any) => {
      if (month.code >= currentMonth && month.code <= 11) {
        monthsToShow.push({...month, year: year});
      }
    });

    this.months.forEach((month: any) => {
      if (month.code < currentMonth && month.code <= 11) {
        monthsToShow.push({...month, year: year + 1})
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
    this.reservationForm.controls.reservationDate.setValue(new Date(yearToGo, month, 1).toISOString());
    this.getReservations();
  }

  public initializeRangePicker(): void {
    const today: Date = new Date();
    const month: number = today.getMonth();
    const year: number = today.getFullYear();

    this.campaignOne = new FormGroup({
      start: new FormControl(new Date(year, month, 1).toISOString()),
      end: new FormControl(new Date(year, month + 1, 1).toISOString()),
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
              this.reservationForm = this.fb.group({
                reservationOnName: this.fb.control('', Validators.required),
                ticketBusLineId: this.fb.control('', Validators.required),
                reservationPhone: this.fb.control(''),
                reservationDate: this.fb.control('', Validators.required),
                reservationTime: this.fb.control('', Validators.required),
                reservationNote: this.fb.control(''),
              });

              this.searchBarForm = this.fb.group({
                searchTerm: this.fb.control(''),
              });
              this.buslines = [...data];
              this.filteredBuslines = this.reservationForm.controls.ticketBusLineId.valueChanges.pipe(
                startWith(''),
                map((value: any) => (typeof value === 'string' ? value : value.lineCityStart)),
                map((name: string) => (name ? this._filter(name) : this.buslines.slice())),
              );
            }),
            concatMap(() =>
              this.reservationService.searchReservationsByDate({
                searchTerm: '',
                pageNumber: 0,
                resultPerPage: 50,
                startDate: this.campaignOne.controls.start.value,
                endDate: this.campaignOne.controls.end.value,
                sortByProp: null,
                sortOption: null,
              }),
            ),
            map((data: ICommonResponse<IReservation[]>) => {
              return data.data.map((res: IReservation) => {
                return {
                  ...res,
                  busLineData: this.getBusLineData(res.ticketBusLineId),
                };
              });
            }),
            tap((data: IReservation[]) => {
              this.reservations = data;
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

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingController.create({ message: msg });
    await loading.present();
  }

  public getReservations(event?: any): void {
    this.presentLoading('Učitavanje rezervacija')
      .then(() => {
        this.reservationService
          .searchReservationsByDate({
            searchTerm: '',
            pageNumber: 0,
            resultPerPage: 100,
            startDate: this.campaignOne.controls.start.value,
            endDate: this.campaignOne.controls.end.value,
            sortByProp: null,
            sortOption: null,
          })
          .pipe(
            map((data: ICommonResponse<IReservation[]>) => {
              return data.data.map((res: IReservation) => {
                return {
                  ...res,
                  busLineData: this.getBusLineData(res.ticketBusLineId),
                };
              });
            }),
            tap((data: IReservation[]) => {
              this.reservations = [...data];
              this.loadingController.dismiss();

              if (event) {
                event.target.complete();
              }
            }),
            catchError((error: Error) => {
              this.loadingController.dismiss();

              if (event) {
                event.target.complete();
              }

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
    this.reservationForm.controls.reservationDate.setValue(date);
  }

  public setTime(time: string): void {
    this.reservationForm.controls.reservationTime.setValue(time);
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

  public async createReservationMobile(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: CreateReservationComponent,
    });
    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        this.reservationForm.reset();
        this.reservations = [
          { ...data.data, busLineData: this.getBusLineData(data.data.ticketBusLineId) },
          ...this.reservations,
        ];
        const month: number = new Date(data.data.reservationDate).getMonth();
        const year: number = new Date(data.data.reservationDate).getFullYear();
        this.goToMonth(month, year);
      }
    });

    return await modal.present();
  }

  public createReservation(): void {
    this.reservationService
      .createReservation(this.reservationForm.value)
      .pipe(
        tap((data: ICommonResponse<IReservation>) => {
          this.reservationForm.reset();
          this.reservations = [
            { ...data.data, busLineData: this.getBusLineData(data.data.ticketBusLineId) },
            ...this.reservations,
          ];
          const month: number = new Date(data.data.reservationDate).getMonth();
          const year: number = new Date(data.data.reservationDate).getFullYear();
          this.goToMonth(month, year);
        }),
        take(1),
      )
      .subscribe();
  }

  public async deleteReservationModal(reservation: IReservation): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: 'Obriši Rezervaciju?',
      message: 'Da li ste sigurni da želite da obrišete rezervaciju?',
      buttons: [
        {
          text: 'Otkaži',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Obriši',
          handler: () => {
            this.deleteReservation(reservation);
          },
        },
      ],
    });

    await alert.present();
  }

  public async convertReservationToTicket(reservation: IReservation): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: ConvertReservationComponent,
      componentProps: {
        reservation: reservation,
      },
    });
    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        this.reservations = this.reservations.filter((res: IReservation) => res._id !== reservation._id);
        this.deleteReservation(reservation);
      }
    });

    return await modal.present();
  }

  public deleteReservation(reservation: IReservation): void {
    this.presentLoading('Brisanje rezervacije')
      .then(() => {
        this.reservationService
          .deleteReservation(reservation._id)
          .pipe(
            tap(() => {
              this.reservations = this.reservations.filter((res: IReservation) => res._id !== reservation._id);
              this.loadingController.dismiss();
              this.getReservations();
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
}
