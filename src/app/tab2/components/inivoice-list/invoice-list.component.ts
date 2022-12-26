import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  ActionSheetController,
  AlertController,
  IonInfiniteScroll,
  LoadingController,
  ModalController,
} from '@ionic/angular';
import { IInvoice } from '@app/tab2/tab2.interface';
import { CreateInvoiceComponent } from '@app/tab2/components/create-invoice/create-invoice.component';
import { InvoiceService } from '@app/tab2/invoice.service';
import { Subject, throwError } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { ICommonResponse } from '@app/services/user.interface';
import { UpdateInvoiceComponent } from '@app/tab2/components/update-invoice/update-invoice.component';

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss'],
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  @Input() public showBackButton: boolean = true;
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public invoices: IInvoice[] = [];
  public searchInvoiceForm: FormGroup;
  public searchLimit: number = 10;
  public searchSkip: number = 0;
  public invoicesCount: number = 0;
  public invoicesTotalCount: number = 0;
  public searchTermValue: string = '';

  public config: any = {
    title: 'fakture',
    icon: 'document-text-outline',
    description: 'Fakture',
    color: '#E63135',
  };

  constructor(
    private actionSheetController: ActionSheetController,
    private modalCtrl: ModalController,
    private invoiceService: InvoiceService,
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
  ) {}

  public ngOnInit(): void {
    this.searchInvoiceForm = this.fb.group({
      searchTerm: this.fb.control(''),
    });

    this.searchInvoiceForm.controls.searchTerm.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(1000),
        tap((data: string) => (data.length ? this.getInvoices(data, 0, 10) : this.getInvoices('', 0, 10))),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();

    this.getInvoices('', 0, this.searchLimit);
  }

  public getInvoices(searchTerm: string, searchSkip: number, searchLimit: number, event?: any): void {
    this.presentLoading('Učitavanje Faktura...')
      .then(() => {
        this.invoiceService
          .searchInvoices({ searchTerm, searchLimit, searchSkip })
          .pipe(
            tap((data: ICommonResponse<IInvoice[]>) => {
              this.invoicesTotalCount = data.count;
              this.searchLimit = searchLimit;
              this.searchTermValue = searchTerm;
              this.searchSkip = 0;
              this.invoices = data.data.map((invoice: IInvoice) => {
                return {
                  ...invoice,
                  driversArray: invoice.invoiceDrivers ? invoice.invoiceDrivers.map((driver: any) => driver.name).join(', ') : '',
                }
              });

              if (event) {
                event.target.complete();
              }

              this.handleInfinitiveLoader();
              this.loadingCtrl.dismiss();
            }),
            take(1),
            catchError((err: Error) => {
              if (event) {
                event.target.complete();
              }

              this.loadingCtrl.dismiss();

              return throwError(err);
            }),
          )
          .subscribe();
      })
      .catch((error: Error) => throwError(error));
  }

  public async presentActionSheet(invoice: IInvoice): Promise<void> {
    const actionSheet: HTMLIonActionSheetElement = await this.actionSheetController.create({
      header: 'Akcije',
      cssClass: 'my-custom-class',
      buttons: [
        {
          text: 'Uredi',
          role: 'uredi',
          icon: 'create-sharp',
          handler: () => {
            this.editInvoice(invoice);
          },
        },
        {
          text: 'Poništi',
          icon: 'trash-sharp',
          handler: () => {
            this.deleteInvoiceModal(invoice);
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

  public deleteInvoice(invoice: IInvoice): void {
    this.presentLoading(`Brisanje fakture broj "${invoice.invoiceNumber}" u toku...`)
      .then(() => {
        this.invoiceService
          .deleteInvoice(invoice._id)
          .pipe(
            take(1),
            finalize(() => {
              this.loadingCtrl.dismiss();
              this.invoices = this.invoices.filter((invoiceToDelete: IInvoice) => invoiceToDelete._id !== invoice._id);
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

  public async deleteInvoiceModal(invoice: IInvoice): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: 'Obriši Fakturu?',
      message: 'Da li ste sigurni da želite da obrišete fakturu?',
      buttons: [
        {
          text: 'Otkaži',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Obriši',
          handler: () => {
            this.deleteInvoice(invoice);
          },
        },
      ],
    });

    await alert.present();
  }

  public async createInvoice(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({ component: CreateInvoiceComponent });

    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        const newInvoice: IInvoice = { ...data.data, driversArray: data.data.invoiceDrivers.map((driver: any) => driver.name).join(', ')};
        this.invoices.unshift(newInvoice);
      }
    });

    return await modal.present();
  }

  public async editInvoice(invoice: IInvoice): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: UpdateInvoiceComponent,
      componentProps: {
        invoiceData: invoice,
      },
    });

    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        const newInvoice: IInvoice = { ...data.data, driversArray: data.data.invoiceDrivers.map((driver: any) => driver.name).join(', ')};
        this.invoices = this.invoices.filter((inv: IInvoice) => inv._id !== invoice._id);
        this.invoices.unshift(newInvoice);
      }
    });

    return await modal.present();
  }

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingCtrl.create({ message: msg });
    await loading.present();
  }

  public getMoreInvoices(): void {
    if (this.invoicesCount <= this.invoicesTotalCount && this.invoicesTotalCount > 10) {
      this.presentLoading('Učitavanje Faktura...')
        .then(() => {
          this.searchSkip += 10;
          this.invoiceService
            .searchInvoices({
              searchTerm: this.searchTermValue,
              searchLimit: this.searchLimit,
              searchSkip: this.searchSkip,
            })
            .pipe(
              filter((data: ICommonResponse<IInvoice[]>) => !!data),
              take(1),
              map((data: ICommonResponse<IInvoice[]>) => {
                this.invoicesCount = data.count;

                return data.data;
              }),
              tap((invoices: IInvoice[]) => {
                if (invoices.length) {
                  this.invoices = [...this.invoices, ...invoices];
                  this.invoicesCount = this.invoices.length;
                } else {
                  this.infiniteScroll.disabled = true;
                }
              }),
              finalize(() => {
                this.handleInfinitiveLoader();

                if (this.invoicesCount >= this.invoicesTotalCount) {
                  this.infiniteScroll.disabled = true;
                }

                this.loadingCtrl.dismiss();
              }),
              catchError((error: Error) => {
                this.loadingCtrl.dismiss();
                this.infiniteScroll.disabled = true;

                return throwError(error);
              }),
            )
            .subscribe();
        })
        .catch((error: Error) => {
          this.loadingCtrl.dismiss();
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

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
