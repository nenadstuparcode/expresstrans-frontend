import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReservationsComponent } from '@app/tab4/reservations/reservations.component';
import { Tab4Page } from '@app/tab4/tab4.page';

const routes: Routes = [
  {
    path: '',
    component: Tab4Page,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'rezervacije',
      },
      {
        path: 'rezervacije',
        component: ReservationsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Tab4PageRoutingModule {}
