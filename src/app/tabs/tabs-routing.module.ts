import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from '@app/services/auth-guard';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'karte',
        canActivate: [AuthGuard],
      },
      {
        path: 'karte',
        // eslint-disable-next-line @typescript-eslint/typedef
        loadChildren: () => import('../tab1/tab1.module').then((m) => m.Tab1PageModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'rezervacije',
        // eslint-disable-next-line @typescript-eslint/typedef
        loadChildren: () => import('../tab4/tab4.module').then((m) => m.Tab4Module),
        canActivate: [AuthGuard],
      },
      {
        path: 'konfiguracija',
        // eslint-disable-next-line @typescript-eslint/typedef
        loadChildren: () => import('../tab2/tab2.module').then((m) => m.Tab2PageModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'korisnik',
        // eslint-disable-next-line @typescript-eslint/typedef
        loadChildren: () => import('../tab3/tab3.module').then((m) => m.Tab3PageModule),
        canActivate: [AuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
