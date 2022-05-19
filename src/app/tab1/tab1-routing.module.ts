import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab1Page } from './tab1.page';
import { TicketsListComponent } from '@app/tab1/components/tickets-list/tickets-list.page';
import { TicketTableComponent } from '@app/tab1/components/ticket-table/ticket-table.component';

const routes: Routes = [
  {
    path: '',
    component: Tab1Page,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'karte',
      },
      {
        path: 'karte',
        component: TicketsListComponent,
      },
      {
        path: 'faktura',
        component: TicketTableComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Tab1PageRoutingModule {}
