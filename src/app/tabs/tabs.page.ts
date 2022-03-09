import { Component } from '@angular/core';
import {AlertController, Platform} from '@ionic/angular';
import { UserServiceService } from '@app/services/user-service.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class TabsPage {
  constructor(
    private alertController: AlertController,
    private accountService: UserServiceService,
    private platform: Platform,
    ) {}

  public isMobile(): boolean {
    return this.platform.is('mobile');
  }

  public async presentAlertConfirm(): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Odjava!',
      message: 'Da li ste sigurni?',
      buttons: [
        {
          text: 'Odustani',
          role: 'cancel',
          cssClass: 'secondary',
          id: 'cancel-button',
        },
        {
          text: 'Odjavi se',
          id: 'confirm-button',
          handler: () => {
            this.logout();
          },
        },
      ],
    });

    await alert.present();
  }

  public logout(): void {
    this.accountService.logout();
  }
}
