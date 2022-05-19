import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { Tab1PageRoutingModule } from './tab1-routing.module';
import { TicketsListComponent } from '@app/tab1/components/tickets-list/tickets-list.page';
import { Tab2PageModule } from '@app/tab2/tab2.module';
import { CreateTicketComponent } from '@app/tab1/components/create-ticket/create-ticket.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { TicketEditComponent } from '@app/tab1/components/ticket-edit/ticket-edit.component';
import { CustomEmailComponent } from '@app/tab1/components/send-custom-email/custom-email.component';
import { MatDialogModule } from '@angular/material/dialog';
import { DatetimeModalComponent } from '@app/tab1/components/datetime-modal/datetime-modal.component';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TicketTableComponent } from '@app/tab1/components/ticket-table/ticket-table.component';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    Tab1PageRoutingModule,
    Tab2PageModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTabsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,

  ],
  declarations: [
    Tab1Page,
    TicketsListComponent,
    CreateTicketComponent,
    TicketEditComponent,
    CustomEmailComponent,
    DatetimeModalComponent,
    TicketTableComponent,
  ],
  exports: [
    TicketsListComponent,
    CreateTicketComponent,
    TicketEditComponent,
    CustomEmailComponent,
    DatetimeModalComponent,
    TicketTableComponent,
  ],
  providers: [MatDatepickerModule],
})
export class Tab1PageModule {}
