import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, throwError } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  LoadingController,
  ModalController,
  PickerColumnOption,
  PickerController,
  ToastController,
} from '@ionic/angular';
import { BusLineService } from '@app/tab2/bus-line.service';
import { catchError, filter, take, takeUntil, tap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ICommonResponse } from '@app/services/user.interface';
import { IBusLine } from '@app/tab2/tab2.interface';

@Component({
  selector: 'app-bus-line-edit',
  templateUrl: './bus-line-edit.component.html',
  styleUrls: ['./bus-line-edit.component.scss'],
})
export class BusLineEditComponent implements OnInit, OnDestroy {
  @Input() public busLine: IBusLine;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public updateBusLineForm: FormGroup;
  public busLineId: string;
  public addStartDayForm: FormGroup;

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
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private pickerCtrl: PickerController,
    private busLineService: BusLineService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
  ) {}

  public get busLineDays(): FormArray {
    return <FormArray>this.updateBusLineForm.controls.lineArray;
  }

  public ngOnInit(): void {
    this.updateBusLineForm = this.initiateUpdateForm(this.busLine);
    this.addStartDayForm = this.fb.group({
      day: this.fb.control(null, Validators.required),
      time: this.fb.control('', Validators.required),
    });
  }

  public isDayIsUsed(selectedDay: number): boolean {
    const usedDays: number[] = this.busLineDays.value.map((item: any) => item.day);

    return usedDays.some((day: number) => day === selectedDay);
  }

  public initiateUpdateForm(busLine: IBusLine): FormGroup {
    return this.fb.group({
      lineCityStart: this.fb.control(busLine.lineCityStart, Validators.required),
      lineCityEnd: this.fb.control(busLine.lineCityEnd, Validators.required),
      linePriceOneWay: this.fb.control(busLine.linePriceOneWay, Validators.required),
      linePriceRoundTrip: this.fb.control(busLine.linePriceRoundTrip, Validators.required),
      lineCountryStart: this.fb.control(busLine.lineCountryStart, Validators.required),
      lineArray: this.fb.array([...busLine.lineArray], Validators.required),
      bihKilometers: this.fb.control(busLine.bihKilometers ? busLine.bihKilometers : 0, Validators.required),
      deKilometers: this.fb.control(busLine.deKilometers ? busLine.deKilometers : 0, Validators.required),
    });
  }

  public setTime(time: string): void {
    this.addStartDayForm.controls.time.setValue(time);
  }

  public addBusLineDay(): void {
    const add: any = this.updateBusLineForm.get('lineArray') as FormArray;

    if (this.addStartDayForm.valid) {
      add.push(this.fb.group(this.addStartDayForm.value));
    }

    this.addStartDayForm.reset();
    this.presentToast('Polazak dodan.');
  }

  public removeBusLineDay(index: number): void {
    const remove: any = this.updateBusLineForm.get('lineArray') as FormArray;
    remove.removeAt(index);
    this.presentToast('Polazak obrisan.');
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
    });
    await toast.present();
  }

  public updateBusLine(): void {
    this.handleButtonClick()
      .then(() => {
        this.busLineService
          .updateBusLine(this.updateBusLineForm.value, this.busLine._id)
          .pipe(
            filter((res: ICommonResponse<IBusLine>) => !!res && this.updateBusLineForm.valid),
            take(1),
            tap((res: ICommonResponse<IBusLine>) => {
              this.loadingCtrl.dismiss();
              this.presentToast('Linija uspjesno uređena.');
              this.modalCtrl.dismiss(res.data, 'save');
            }),
            catchError((err: any) => {
              this.loadingCtrl.dismiss();

              return throwError(err);
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

  public dismissModal(): void {
    this.modalCtrl.dismiss(null, 'dismiss');
  }

  public async handleButtonClick(): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingCtrl.create({
      message: 'Kreiranje Linije...',
      duration: 1000,
    });

    await loading.present();
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
