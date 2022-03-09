import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { Subject, throwError } from 'rxjs';
import { ITicket } from '@app/tab1/ticket.interface';
import { catchError, filter, takeUntil, tap } from 'rxjs/operators';
import { ICommonResponse } from '@app/services/user.interface';
import { TicketService } from '@app/tab1/ticket.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-ticket',
  templateUrl: './custom-email.component.html',
  styleUrls: ['./custom-email.component.scss'],
})
export class CustomEmailComponent implements OnInit, OnDestroy {
  @Input() ticketData: ITicket = null;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public sendEmailForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private ticketService: TicketService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder,
  ) {}

  public ngOnInit(): void {
    this.sendEmailForm = this.fb.group({
      email: this.fb.control('', Validators.required),
    });
  }

  public dismissModal(): void {
    this.modalController.dismiss(
      {
        dismissed: true,
      },
      'dismiss',
    );
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
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
      color: 'primary',
      duration: 2500,
    });
    await toast.present();
  }

  public emailTicketCustom(ticket: ITicket): void {
    if (this.sendEmailForm.valid) {
      this.presentLoading('Karta se šalje na korisnikov email...')
        .then(() => {
          this.ticketService
            .emailTicketCustom(ticket, this.sendEmailForm.controls.email.value)
            .pipe(
              filter((data: ICommonResponse<boolean>) => !!data),
              tap((data: ICommonResponse<boolean>) => {
                this.presentToast(data.message);
                this.sendEmailForm.reset();
                this.loadingController.dismiss();
              }),
              catchError((error: Error) => {
                this.loadingController.dismiss();
                this.sendEmailForm.reset();

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
  }
}
