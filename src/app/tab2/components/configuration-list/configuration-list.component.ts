import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-configuration-list',
  templateUrl: './configuration-list.component.html',
  styleUrls: ['./configuration-list.component.scss'],
})
export class ConfigurationListComponent {
  public configs: any[] = [
    {
      title: 'fakture',
      icon: 'document-text-outline',
      description: 'Fakture',
      color: '#E63135',
    },
    {
      title: 'linije',
      icon: 'bus-sharp',
      description: 'Linije',
      color: '#E63135',
    },
    {
      title: 'vozila',
      icon: 'car-outline',
      description: 'Vozači, tablice',
      color: '#E63135',
    },
    {
      title: 'izvjestaj-gradovi',
      icon: 'business-outline',
      description: 'Izvještaj po gradovima',
      color: '#E63135',
    },
    {
      title: 'izvjestaj-karte',
      icon: 'business-outline',
      description: 'Izvještaj bez gradova',
      color: '#E63135',
    },
    {
      title: 'uvezi-karte',
      icon: 'server-outline',
      description: 'Uvezi karte',
      color: '#E63135',
    }
  ];

  constructor(private router: Router) {}

  public showDetail(title: string): void {
    this.router.navigate([`/konfiguracija/${title}`]);
  }
}
