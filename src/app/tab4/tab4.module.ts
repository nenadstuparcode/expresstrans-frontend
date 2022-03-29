import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationsComponent } from '@app/tab4/reservations/reservations.component';
import { Tab4Page } from '@app/tab4/tab4.page';
import { Tab4PageRoutingModule } from '@app/tab4/tab4-routing.module';

@NgModule({
  declarations: [Tab4Page, ReservationsComponent],
  imports: [Tab4PageRoutingModule, CommonModule],
})
export class Tab4Module {}
