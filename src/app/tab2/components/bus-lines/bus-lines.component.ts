import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  ActionSheetController,
  AlertController,
  IonInfiniteScroll,
  LoadingController,
  ModalController,
  PickerColumnOption,
  ToastController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { IBusLine } from '@app/tab2/tab2.interface';
import { BusLineService } from '@app/tab2/bus-line.service';
import { catchError, debounceTime, distinctUntilChanged, filter, finalize, take, takeUntil, tap } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ICommonResponse } from '@app/services/user.interface';
import { BusLineEditComponent } from '@app/tab2/components/bus-line-edit/bus-line-edit.component';
import { BusLineCreateComponent } from '@app/tab2/components/bus-line-create/bus-line-create.component';

@Component({
  selector: 'app-bus-lines',
  templateUrl: './bus-lines.component.html',
  styleUrls: ['./bus-lines.component.scss'],
})
export class BusLinesComponent implements OnInit, OnDestroy {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  public searchBarForm: FormGroup;
  public searchLimit: number = 10;
  public searchSkip: number = 0;
  public busLinesCount: number = 0;
  public searchTermValue: string = '';
  public busLineTotalCount: number = 0;
  public bihImage: string = 'assets/images/bih.png';
  public deImage: string = 'assets/images/germany.png';
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public tech: any = {
    title: 'linije',
    icon: 'bus-sharp',
    description: 'Linije',
    color: '#E63135',
  };

  public busLines: IBusLine[] = [];
  public availableDays: PickerColumnOption[] = [
    { text: 'Nedelja', value: 0 },
    { text: 'Ponedeljak', value: 1 },
    { text: 'Utorak', value: 2 },
    { text: 'Srijeda', value: 3 },
    { text: 'Četvrtak', value: 4 },
    { text: 'Petak', value: 5 },
    { text: 'Subota', value: 6 },
  ];

  constructor(
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private router: Router,
    private busLineService: BusLineService,
    public toastController: ToastController,
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loadingController: LoadingController,
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
        tap((data: string) => (data.length ? this.getBusLines(data, 10, 0) : this.getBusLines('', 10, 0))),
        takeUntil(this.componentDestroyed$),
      )
      .subscribe();

    this.getBusLines('', this.searchLimit, 0);
  }

  public getMoreBusLines(): void {
    if (this.busLinesCount <= this.busLineTotalCount && this.busLineTotalCount > 10) {
      this.searchSkip += 10;
      this.busLineService
        .searchBusLines({
          searchTerm: this.searchTermValue,
          searchLimit: this.searchLimit,
          searchSkip: this.searchSkip,
        })
        .pipe(
          filter((data: ICommonResponse<IBusLine[]>) => !!data),
          take(1),
          tap((data: ICommonResponse<IBusLine[]>) => {
            this.busLines = [...this.busLines, ...data.data];
            this.busLinesCount = this.busLines.length;
          }),
          finalize(() => {
            this.handleInfinitiveLoader();

            if (this.busLinesCount >= this.busLineTotalCount) {
              this.infiniteScroll.disabled = true;
            }
          }),
        )
        .subscribe();
    } else {
      this.infiniteScroll.disabled = true;
    }
  }

  public handleInfinitiveLoader(): void {
    this.infiniteScroll.disabled = true;
    this.infiniteScroll.disabled = false;
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastController.create({
      message: msg,
      duration: 2500,
      color: 'primary',
    });

    await toast.present();
  }

  public deleteBusLine(id: string): void {
    this.busLineService
      .deleteBusLine(id)
      .pipe(
        take(1),
        finalize(() => {
          this.presentToast('Linija je obrisana.');
          this.busLines = [...this.busLines.filter((busLine: IBusLine) => busLine._id !== id)];
        }),
        take(1),
      )
      .subscribe();
  }

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingController.create({ message: msg });
    await loading.present().catch((error: Error) => {
      this.presentToast(error.message);
    });
  }

  public getBusLines(searchTerm: string, searchLimit: number, searchSkip: number, event?: any): void {
    this.presentLoading('Ucitavanje linija...')
      .then(() => {
        this.busLineService
          .searchBusLines({ searchTerm, searchLimit, searchSkip })
          .pipe(
            filter((data: ICommonResponse<IBusLine[]>) => !!data),
            take(1),
            tap((data: ICommonResponse<IBusLine[]>) => {
              this.searchSkip = 0;
              this.busLines = data.data;
              this.busLinesCount = this.busLines.length;
              this.busLineTotalCount = data.count;
              this.searchTermValue = searchTerm;

              if (event) {
                event.target.complete();
              }
            }),
            finalize(() => {
              this.handleInfinitiveLoader();
              this.loadingController.dismiss();
            }),
            catchError((err: any) => {
              if (event) {
                event.target.complete();
              }

              this.loadingController.dismiss();

              return throwError(err);
            }),
          )
          .subscribe();
      })
      .catch((error: Error) => {
        if (event) {
          event.target.complete();
        }

        this.loadingController.dismiss();

        return throwError(error);
      });
  }

  public async deleteBusLineModal(id: string): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Obriši Liniju?',
      message: 'Da li ste sigurni da želite da obrišete liniju?',
      buttons: [
        {
          text: 'Otkaži',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Obriši',
          handler: () => {
            this.deleteBusLine(id);
          },
        },
      ],
    });

    await alert.present();
  }

  public async presentActionSheet(id: string): Promise<void> {
    const actionSheet: HTMLIonActionSheetElement = await this.actionSheetController.create({
      header: 'Akcije',
      cssClass: 'my-custom-class',
      buttons: [
        {
          text: 'Uredi',
          role: 'uredi',
          icon: 'create-sharp',
          handler: () => {
            this.openEditBuslinetModal(this.busLines.find((line: IBusLine) => line._id === id));
          },
        },
        {
          text: 'Obriši',
          icon: 'trash-sharp',
          handler: () => {
            this.deleteBusLineModal(id);
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

  public async openCreateBuslineModal(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({ component: BusLineCreateComponent });

    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        const newBusLine: IBusLine = data.data;
        this.busLines.unshift(newBusLine);
      }
    });

    return await modal.present();
  }

  public async openEditBuslinetModal(data: IBusLine): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: BusLineEditComponent,
      componentProps: {
        busLine: data,
      },
    });

    modal.onDidDismiss().then((res: any) => {
      if (res.role === 'save') {
        const newBusLine: IBusLine = res.data;
        this.busLines = this.busLines.filter((bus: IBusLine) => bus._id !== data._id)
        this.busLines.unshift(newBusLine);
      }
    });

    return await modal.present();
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
