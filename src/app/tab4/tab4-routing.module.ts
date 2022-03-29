import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@app/services/auth-guard';
import { ReservationsComponent } from '@app/tab4/reservations/reservations.component';
import { Tab4Page } from '@app/tab4/tab4.page';

const routes: Routes = [
  {
    path: '',
    component: Tab4Page,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'rezervacije',
        canActivate: [AuthGuard],
      },
      {
        path: 'rezervacije',
        component: ReservationsComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Tab4PageRoutingModule {}
