import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { saveAs } from 'file-saver';
import {
  ActionSheetController,
  AlertController,
  IonInfiniteScroll,
  LoadingController,
  ModalController,
  Platform,
  ToastController,
} from '@ionic/angular';
import { Subject, throwError } from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { CreateTicketComponent } from '@app/tab1/components/create-ticket/create-ticket.component';
import { TicketService } from '@app/tab1/ticket.service';
import { ITicket, TicketType } from '@app/tab1/ticket.interface';
import { BusLineService } from '@app/tab2/bus-line.service';
import { IBusLine } from '@app/tab2/tab2.interface';
import { ICommonResponse } from '@app/services/user.interface';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TicketEditComponent } from '@app/tab1/components/ticket-edit/ticket-edit.component';
import { File } from '@ionic-native/file';
import { FileOpener } from '@ionic-native/file-opener';
import { CallNumber } from 'capacitor-call-number';
import { CustomEmailComponent } from '@app/tab1/components/send-custom-email/custom-email.component';

@Component({
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.page.html',
  styleUrls: ['./tickets-list.page.scss'],
})
export class TicketsListComponent implements OnInit, OnDestroy {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  @ViewChild('link') link: any;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public searchLimit: number = 10;
  public searchSkip: number = 0;
  public ticketsCount: number = 0;
  public ticketTotalCount: number = 0;
  public searchTermValue: string = '';
  public searchBarForm: FormGroup;
  public bihImage: string = 'assets/images/bih.png';
  public deImage: string = 'assets/images/germany.png';
  public tickets: ITicket[] = [];
  public busLines: IBusLine[] = [];

  constructor(
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private ticketService: TicketService,
    private busLineService: BusLineService,
    private fb: FormBuilder,
    private loadingController: LoadingController,
    private platform: Platform,
    private toastController: ToastController,
    private alertController: AlertController,
  ) {}

  public ngOnInit(): void {
    this.searchBarForm = this.fb.group({
      searchTerm: this.fb.control(''),
    });

    this.searchBarForm
      .get('searchTerm')
      .valueChanges.pipe(
        debounceTime(1200),
        distinctUntilChanged(),
        tap((data: string) =>
          data.length ?
            this.getTickets(data, 10, 0) :
            this.getTickets('', 10, 0),
        ),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();

    this.getTickets('', this.searchLimit, 0);
  }

  public get TicketTypes(): typeof TicketType {
    return TicketType;
  }

  public getTickets(
    searchTerm: string,
    searchLimit: number,
    searchSkip: number,
    event?: any,
  ): void {
    this.presentLoading('Učitavanje karti...').then(() => {
      this.busLineService
        .getBusLines()
        .pipe(
          tap((data: IBusLine[]) => (this.busLines = data)),
          concatMap(() =>
            this.ticketService.searchTickets({
              searchTerm,
              searchLimit,
              searchSkip,
            }),
          ),
          filter((data: ICommonResponse<ITicket[]>) => !!data),
          map((data: ICommonResponse<ITicket[]>) => {
            this.ticketTotalCount = data.count;
            this.searchLimit = searchLimit;
            this.searchTermValue = searchTerm;
            this.searchSkip = 0;

            return data.data.map((ticket: ITicket) => ({
              ...ticket,
              busLineData: this.getBusLineData(ticket.ticketBusLineId),
            }));
          }),
          tap((data: ITicket[]) => {
            this.tickets = [...data];
            this.ticketsCount = this.tickets.length;

            if (event) {
              event.target.complete();
            }

            this.handleInfinitiveLoader();
            this.loadingController.dismiss();
          }),
          catchError((err: Error) => {
            if (event) {
              event.target.complete();
            }

            this.loadingController.dismiss();

            return throwError(err);
          }),
          take(1),
        )
        .subscribe();
    });
  }

  public getMoreTickets(): void {
    if (this.ticketsCount <= this.ticketTotalCount && this.ticketTotalCount > 10) {
      this.presentLoading('Učitavanje karti...')
        .then(() => {
          this.searchSkip += 10;
          this.ticketService
            .searchTickets({
              searchTerm: this.searchTermValue,
              searchLimit: this.searchLimit,
              searchSkip: this.searchSkip,
            })
            .pipe(
              filter((data: ICommonResponse<ITicket[]>) => !!data),
              take(1),
              map((data: ICommonResponse<ITicket[]>) => {
                this.ticketsCount = data.count;

                return data.data.map((ticket: ITicket) => ({
                  ...ticket,
                  busLineData: this.getBusLineData(ticket.ticketBusLineId),
                }));
              }),
              tap((tickets: ITicket[]) => {
                if (tickets.length) {
                  this.tickets = [...this.tickets, ...tickets];
                  this.ticketsCount = this.tickets.length;
                } else {
                  this.infiniteScroll.disabled = true;
                }
              }),
              finalize(() => {
                this.handleInfinitiveLoader();

                if (this.ticketsCount >= this.ticketTotalCount) {
                  this.infiniteScroll.disabled = true;
                }

                this.loadingController.dismiss();
              }),
              catchError((error: Error) => {
                this.loadingController.dismiss();
                this.infiniteScroll.disabled = true;

                return throwError(error);
              }),
            )
            .subscribe();
        })
        .catch((error: Error) => {
          this.loadingController.dismiss();
          this.infiniteScroll.disabled = true;

          return throwError(error);
        });
    } else {
      this.infiniteScroll.disabled = true;
    }
  }

  public handleInfinitiveLoader(): void {
    this.infiniteScroll.disabled = true;
    this.infiniteScroll.disabled = false;
  }

  public getBusLineData(busLineId: string): IBusLine {
    // eslint-disable-next-line no-underscore-dangle
    return this.busLines.find((line: IBusLine) => line._id === busLineId);
  }

  public disableTicket(ticket: ITicket): void {
    this.presentLoading('Storniranje karte').then(() => {
      this.ticketService.updateTicket({ ...ticket, ticketDisabled: true}, ticket._id).pipe(
        tap(() => {
          this.loadingController.dismiss();
          this.presentToast('Karta stornirana.');
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

  public async presentActionSheet(ticket: ITicket): Promise<void> {
    const actionSheet: HTMLIonActionSheetElement = await this.actionSheetController.create({
      header: 'Akcije',
      cssClass: 'my-custom-class',
      buttons: [
        {
          text: 'Uredi',
          role: 'uredi',
          icon: 'create-sharp',
          handler: () => {
            this.editTicket(ticket);
          },
        },
        {
          text: 'Storniraj',
          icon: 'close-outline',
          handler: () => {
            this.disableTicket(ticket);
          },
        },
        {
          text: 'Poništi',
          icon: 'trash-sharp',
          handler: () => {
            this.deleteTicketModal(ticket);
          },
        },
        {
          text: 'Pošalji na email',
          icon: 'mail-sharp',
          handler: () => {
            this.emailTicket(ticket);
          },
        },
        {
          text: 'Štampaj',
          icon: 'print',
          handler: () => {
            this.printTicket(ticket);
          },
        },
        {
          text: `Pozovi (${ticket?.ticketPhone || '---'})`,
          icon: 'call',
          handler: () => {
            this.callCustomer(ticket.ticketPhone);
          },
        },
        {
          text: 'Pošalji na određeni email',
          icon: 'mail-sharp',
          handler: () => {
            this.openCustomEmailModal(ticket);
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

  public async callCustomer(phoneNum: string): Promise<void> {
    if (this.platform.is('android') || this.platform.is('ios')) {
      await CallNumber.call({ number: phoneNum, bypassAppChooser: false });
    } else {
      await this.presentToast('Ova opcija je dozvoljena za mobilne uređaje');
    }
  }

  public emailTicket(ticket: ITicket): void {
    this.presentLoading('Karta se šalje na korisnikov email...')
      .then(() => {
        this.ticketService
          .emailTicket(ticket)
          .pipe(
            filter((data: ICommonResponse<boolean>) => !!data),
            tap((data: ICommonResponse<boolean>) => {
              this.presentToast(data.message);
              this.loadingController.dismiss();
            }),
            catchError((error: Error) => {
              this.loadingController.dismiss();

              return throwError(error);
            }),
            takeUntil(this.componentDestroyed$),
          )
          .subscribe();
      })
      .catch((error: Error) => {
        this.loadingController.dismiss();

        return throwError(error);
      });
  }

  public emailTicketCustom(ticket: ITicket, sendToEmail: string): void {
    this.presentLoading('Karta se šalje na korisnikov email...')
      .then(() => {
        this.ticketService
          .emailTicketCustom(ticket, sendToEmail)
          .pipe(
            filter((data: ICommonResponse<boolean>) => !!data),
            tap((data: ICommonResponse<boolean>) => {
              this.presentToast(data.message);
              this.loadingController.dismiss();
            }),
            catchError((error: Error) => {
              this.loadingController.dismiss();
              this.presentToast(error.message);

              return throwError(error);
            }),
            takeUntil(this.componentDestroyed$),
          )
          .subscribe();
      })
      .catch((error: Error) => {
        this.loadingController.dismiss();

        return throwError(error);
      });
  }

  public async createTicket(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: CreateTicketComponent,
    });
    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        const newTicket: ITicket = {
          ...data.data,
          busLineData: this.getBusLineData(data.data.ticketBusLineId),
        };
        this.tickets.unshift(newTicket);
      }
    });

    return await modal.present();
  }

  public async openCustomEmailModal(ticket: ITicket): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: CustomEmailComponent,
      componentProps: {
        ticketData: ticket,
      },
    });

    return await modal.present();
  }

  public async editTicket(ticket: ITicket): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: TicketEditComponent,
      componentProps: {
        ticketData: ticket,
      },
    });

    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        const newTicket: ITicket = {
          ...data.data,
          busLineData: this.getBusLineData(data.data.ticketBusLineId),
        };
        this.tickets = this.tickets.filter((tick: ITicket) => tick._id !== ticket._id);
        this.tickets.unshift(newTicket);
      }
    });

    return await modal.present();
  }

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingController.create({ message: msg });
    await loading.present().catch((err: Error) => {
      this.presentToast(err.message);
    });
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastController.create({
      message: msg,
      duration: 2500,
      color: 'primary',
    });

    await toast.present();
  }

  public printTicket(ticket: ITicket): void {
    this.presentLoading('Štampanje karte u toku...')
      .then(() => {
        this.ticketService
          .printTicket(ticket)
          .pipe(
            take(1),
            tap((response: ArrayBuffer) => {
              if (this.platform.is('android') || this.platform.is('iphone')) {
                try {
                  File.writeFile(
                    File.documentsDirectory,
                    `${ticket.ticketOnName}_express_trans.pdf`,
                    new Blob([response], { type: 'application/pdf' }),
                    {
                      replace: true,
                    },
                  ).catch((error: Error) => throwError(error));

                  File.writeFile(
                    File.externalRootDirectory + '/Download',
                    `${ticket.ticketOnName}_express_trans.pdf`,
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
                saveAs(file, 'karta-express-trans.pdf');
              }
            }),
            tap(() => {
              this.loadingController.dismiss();
              FileOpener.open(
                File.externalRootDirectory +
                  '/Downloads/' +
                  'karta-express-trans.pdf',
                'application/pdf',
              );

              this.presentToast('Štampanje završeno.');
            }),
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

  public deleteTicket(ticket: ITicket): void {
    this.presentLoading(
      `Brisanje karte na ime "${ticket.ticketOnName}" u toku...`,
    )
      .then(() => {
        this.ticketService
          .deleteTicket(ticket._id)
          .pipe(
            filter((data: ICommonResponse<any>) => !!data),
            tap(() => {
              this.tickets = [
                ...this.tickets.filter(
                  (ticketToDelete: ITicket) => ticketToDelete._id !== ticket._id,
                ),
              ];
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

  public async deleteTicketModal(ticket: ITicket): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
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

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
