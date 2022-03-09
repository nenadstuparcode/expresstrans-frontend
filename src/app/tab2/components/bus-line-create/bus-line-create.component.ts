import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter, take, takeUntil, tap } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';
import {
  LoadingController,
  ModalController,
  PickerColumnOption,
  PickerController,
  ToastController,
} from '@ionic/angular';
import { BusLineService } from '@app/tab2/bus-line.service';
import { ICommonResponse } from '@app/services/user.interface';
import { ICreateBusLineResponse } from '@app/tab2/tab2.interface';

@Component({
  selector: 'app-bus-line-create',
  templateUrl: './bus-line-create.component.html',
  styleUrls: ['./bus-line-create.component.scss'],
})
export class BusLineCreateComponent implements OnInit, OnDestroy {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public createBusLineForm: FormGroup;
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
    private pickerCtrl: PickerController,
    private busLineService: BusLineService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
  ) {}

  public get busLineDays(): FormArray {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return <FormArray>this.createBusLineForm.controls.lineArray;
  }

  public ngOnInit(): void {
    this.createBusLineForm = this.createForm();
    this.addStartDayForm = this.fb.group({
      day: this.fb.control(null, Validators.required),
      time: this.fb.control('', Validators.required),
    });
  }

  public isDayIsUsed(selectedDay: number): boolean {
    const usedDays: number[] = this.busLineDays.value.map((item: any) => item.day);

    return usedDays.some((day: number) => day === selectedDay);
  }

  public createForm(): FormGroup {
    return this.fb.group({
      lineCityStart: this.fb.control('', Validators.required),
      lineCityEnd: this.fb.control('', Validators.required),
      linePriceOneWay: this.fb.control('', Validators.required),
      linePriceRoundTrip: this.fb.control('', Validators.required),
      lineCountryStart: this.fb.control('bih', Validators.required),
      lineArray: this.fb.array([], Validators.required),
      bihKilometers: this.fb.control(0, Validators.required),
      deKilometers: this.fb.control(0, Validators.required),
    });
  }

  public setTime(time: string): void {
    this.addStartDayForm.controls.time.setValue(time);
  }

  public addBusLineDay(): void {
    const add: any = this.createBusLineForm.get('lineArray') as FormArray;

    if (this.addStartDayForm.valid) {
      add.push(this.fb.group(this.addStartDayForm.value));
    }

    this.addStartDayForm.reset();
    this.presentToast('Polazak dodan.');
  }

  public removeBusLineDay(index: number): void {
    const remove: any = this.createBusLineForm.get('lineArray') as FormArray;
    remove.removeAt(index);
    this.presentToast('Polazak obrisan.');
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
    });
    await toast.present();
  }

  public createBusLine(): void {
    this.handleButtonClick()
      .then(() => {
        this.busLineService
          .createBusLine(this.createBusLineForm.value)
          .pipe(
            take(1),
            filter((data: ICommonResponse<ICreateBusLineResponse>) => !!data && this.createBusLineForm.valid),
            tap((data: ICommonResponse<ICreateBusLineResponse>) => {
              this.loadingCtrl.dismiss();
              this.modalCtrl.dismiss(data.data, 'save');
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
    });

    await loading.present();
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
