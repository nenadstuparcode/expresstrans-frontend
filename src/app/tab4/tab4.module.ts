import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationsComponent } from '@app/tab4/reservations/reservations.component';
import { Tab4Page } from '@app/tab4/tab4.page';
import { Tab4PageRoutingModule } from '@app/tab4/tab4-routing.module';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { ReservationService } from '@app/tab4/tab4.service';
import { ConvertReservationComponent } from '@app/tab4/convert-reservation/convert-reservation.component';
import {CreateReservationComponent} from "@app/tab4/create-reservation/create-reservation.component";

@NgModule({
  declarations: [Tab4Page, ReservationsComponent, ConvertReservationComponent, CreateReservationComponent],
  imports: [
    Tab4PageRoutingModule,
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatTableModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatDialogModule,
    MatNativeDateModule,
  ],
  exports: [ConvertReservationComponent, CreateReservationComponent],
  providers: [ReservationService],
})
export class Tab4Module {}
