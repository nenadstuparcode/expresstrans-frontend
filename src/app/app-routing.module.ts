import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    // eslint-disable-next-line @typescript-eslint/typedef
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
  },
  {
    path: 'register',
    // eslint-disable-next-line @typescript-eslint/typedef
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule),
  },
  {
    path: 'login',
    // eslint-disable-next-line @typescript-eslint/typedef
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'otp',
    // eslint-disable-next-line @typescript-eslint/typedef
    loadChildren: () => import('./otp/otp.module').then(m => m.OtpPageModule),
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
