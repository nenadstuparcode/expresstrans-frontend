import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import { Tab2PageRoutingModule } from './tab2-routing.module';
import { BusLinesComponent } from '@app/tab2/components/bus-lines/bus-lines.component';
import { ConfigurationListComponent } from '@app/tab2/components/configuration-list/configuration-list.component';
import { BusLineEditComponent } from '@app/tab2/components/bus-line-edit/bus-line-edit.component';
import { BusLineCreateComponent } from '@app/tab2/components/bus-line-create/bus-line-create.component';
import { BusLineService } from '@app/tab2/bus-line.service';
import { ReportComponent } from '@app/tab2/components/reports/report.component';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { ReportService } from '@app/tab2/components/reports/report.service';
import { TruncatePipe } from '@app/pipes/truncate.pipe';
import { InvoiceListComponent } from '@app/tab2/components/inivoice-list/invoice-list.component';
import { DriverListComponent } from '@app/tab2/components/driver-list/driver-list.component';
import { CreateDriverComponent } from '@app/tab2/components/create-driver/create-driver.component';
import { UpdateDriverComponent } from '@app/tab2/components/update-driver/update-driver.component';
import { DriverService } from '@app/tab2/driver.service';
import { CreateVehicleComponent } from '@app/tab2/components/create-vehicle/create-vehicle.component';
import { UpdateVehicleComponent } from '@app/tab2/components/update-vehicle/update-vehicle.component';
import { InvoiceService } from '@app/tab2/invoice.service';
import { CreateInvoiceComponent } from '@app/tab2/components/create-invoice/create-invoice.component';
import { UpdateInvoiceComponent } from '@app/tab2/components/update-invoice/update-invoice.component';
import { ReportsCityComponent } from '@app/tab2/components/reports-city/reports-city.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReportsTicketsComponent } from '@app/tab2/components/report-tickets/report-tickets.component';
import { MatTabsModule } from '@angular/material/tabs';
import { ImportTicketsComponent } from '@app/tab2/components/import-tickets/import-tickets.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    Tab2PageRoutingModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatDialogModule,
  ],
  exports: [
    BusLinesComponent,
    ConfigurationListComponent,
    BusLineEditComponent,
    BusLineCreateComponent,
    ReportComponent,
    InvoiceListComponent,
    DriverListComponent,
    CreateDriverComponent,
    UpdateDriverComponent,
    CreateVehicleComponent,
    UpdateVehicleComponent,
    CreateInvoiceComponent,
    UpdateInvoiceComponent,
    ReportsCityComponent,
    ReportsTicketsComponent,
    ImportTicketsComponent,
  ],
  declarations: [
    Tab2Page,
    BusLinesComponent,
    ConfigurationListComponent,
    BusLineEditComponent,
    BusLineCreateComponent,
    ReportComponent,
    TruncatePipe,
    InvoiceListComponent,
    DriverListComponent,
    CreateDriverComponent,
    UpdateDriverComponent,
    CreateVehicleComponent,
    UpdateVehicleComponent,
    CreateInvoiceComponent,
    UpdateInvoiceComponent,
    ReportsCityComponent,
    ReportsTicketsComponent,
    ImportTicketsComponent,
  ],
  providers: [BusLineService, ReportService, DriverService, InvoiceService, MatDatepickerModule, DatePipe],
})
export class Tab2PageModule {}
