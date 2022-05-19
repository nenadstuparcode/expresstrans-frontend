import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab3Page } from './tab3.page';
import {TicketTableComponent} from '@app/tab3/components/ticket-table/ticket-table.component';

const routes: Routes = [
  {
    path: '',
    component: Tab3Page,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'fakture',
      },
      {
        path: 'fakture',
        component: TicketTableComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Tab3PageRoutingModule {}
