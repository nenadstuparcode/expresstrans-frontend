import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab2Page } from './tab2.page';
import { BusLinesComponent } from '@app/tab2/components/bus-lines/bus-lines.component';
import { ConfigurationListComponent } from '@app/tab2/components/configuration-list/configuration-list.component';
import { BusLineEditComponent } from '@app/tab2/components/bus-line-edit/bus-line-edit.component';
import { BusLineCreateComponent } from '@app/tab2/components/bus-line-create/bus-line-create.component';
import { ReportComponent } from '@app/tab2/components/reports/report.component';
import { InvoiceListComponent } from '@app/tab2/components/inivoice-list/invoice-list.component';
import { DriverListComponent } from '@app/tab2/components/driver-list/driver-list.component';
import { ReportsCityComponent } from '@app/tab2/components/reports-city/reports-city.component';
import {ReportsTicketsComponent} from "@app/tab2/components/report-tickets/report-tickets.component";

const routes: Routes = [
  {
    path: '',
    component: Tab2Page,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'lista',
      },
      {
        path: 'lista',
        component: ConfigurationListComponent,
      },
      {
        path: 'linije',
        component: BusLinesComponent,
      },
      {
        path: 'vozila',
        component: DriverListComponent,
      },
      {
        path: 'izvjestaji',
        component: ReportComponent,
      },
      {
        path: 'izvjestaj-gradovi',
        component: ReportsCityComponent,
      },
      {
        path: 'izvjestaj-karte',
        component: ReportsTicketsComponent,
      },
      {
        path: 'fakture',
        component: InvoiceListComponent,
      },
      {
        path: 'linije/uredi/:id',
        component: BusLineEditComponent,
      },
      {
        path: 'linije/kreiraj',
        component: BusLineCreateComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Tab2PageRoutingModule {}
