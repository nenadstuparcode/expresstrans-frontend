import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { BusLineService } from '@app/tab2/bus-line.service';
import { take, takeUntil, tap } from 'rxjs/operators';
import { IBusLine, IInvoice } from '@app/tab2/tab2.interface';
import { TicketType } from '@app/tab1/ticket.interface';
import { InvoiceService } from '@app/tab2/invoice.service';
import { ICommonResponse } from '@app/services/user.interface';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DatetimeModalComponent } from '@app/tab1/components/datetime-modal/datetime-modal.component';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TicketService } from '@app/tab1/ticket.service';
import { CreateInvoiceComponent } from '@app/tab2/components/create-invoice/create-invoice.component';
import { ModalController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-import-tickets',
  templateUrl: './import-tickets.component.html',
  styleUrls: ['./import-tickets.component.scss'],
})
export class ImportTicketsComponent implements OnInit {
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public buslines: IBusLine[] = [];
  public invoices: IInvoice[] = [];
  public importForm1: FormGroup;
  public importForm2: FormGroup;
  public config: any = {
    title: 'uvezi-fakture',
    icon: 'import',
    description: 'Uvezi Fakture',
    color: '#E63135',
  };

  constructor(
    private buslineService: BusLineService,
    private invoiceService: InvoiceService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    public ticketService: TicketService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) {}

  public ngOnInit(): void {
    this.importForm1 = this.fb.group({
      invoiceDate: this.fb.control('', Validators.required),
      invoiceId: this.fb.control('', Validators.required),
      invoicePublicId: this.fb.control('', Validators.required),
      ticketsToStore: this.fb.control([], Validators.required),
    });

    this.importForm2 = this.fb.group({
      invoiceDate: this.fb.control('', Validators.required),
      invoiceId: this.fb.control('', Validators.required),
      invoicePublicId: this.fb.control('', Validators.required),
      ticketsToStore: this.fb.control([], Validators.required),
    });

    this.buslineService
      .getBusLines()
      .pipe(
        tap((data: IBusLine[]) => this.buslines = data),
        take(1),
      )
      .subscribe();

    this.invoiceService
      .searchInvoices({ searchTerm: '', searchSkip: 0, searchLimit: 1000 })
      .pipe(
        tap((data: ICommonResponse<IInvoice[]>) => this.invoices = data.data),
        take(1),
      )
      .subscribe();
  }

  public async presentToast(msg: string): Promise<void> {
    const toast: HTMLIonToastElement = await this.toastCtrl.create({
      message: msg,
      duration: 1500,
    });

    await toast.present();
  }

  public importTickets(test: boolean, form: FormGroup): void {
    if (form.valid && !test) {
      this.ticketService
        .importMany(form.value)
        .pipe(
          tap((data: any) => {
            this.presentToast(data.message);
          }),
          takeUntil(this.componentDestroyed$),
        )
        .subscribe();
    }

    form.reset();
  }

  public selectInvoice(event: any, form: FormGroup): void {
    const invoice: IInvoice = event.detail.value;
    form.controls.invoiceId.setValue(invoice.invoiceNumber);
    form.controls.invoicePublicId.setValue(invoice.invoicePublicId);
  }

  public openDateModal(type: 'date' | 'time', form: FormGroup): void {
    const dialogRef: MatDialogRef<DatetimeModalComponent> = this.dialog.open(DatetimeModalComponent, {
      height: '400px',
      width: '400px',
      data: type,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((result: any) => {
        if (result) {
          type === 'date' ? this.setDate(result, form) : this.setTime(result, form);
        }
      });
  }

  public setDate(date: string, form: FormGroup): void {
    form.controls.invoiceDate.setValue(date);
  }

  public setTime(time: string, form: FormGroup): void {
    form.controls.invoiceDate.setValue(time);
  }

  public fileUpload(event: any, form: FormGroup): void {
    const selectedFile: File = event.target.files[0];
    const fileReader: FileReader = new FileReader();
    fileReader.readAsBinaryString(selectedFile);

    fileReader.onload = (event: any) => {
      const binaryData: any = event.target.result;
      const workbook: any = XLSX.read(binaryData, { type: 'binary' });
      const tickets: any = XLSX.utils.sheet_to_json(workbook.Sheets['Book1']);

      const ticketsToStore: any[] = tickets.map((ticket: any) => {
        return {
          ticketBusLineId: this.getBuslineId(ticket['Iz'].toString().trim(), ticket['Za'].toString().trim()),
          ticketClassicId: this.escapeZero(ticket['Broj karte']),
          ticketDiscount: 0,
          ticketEmail: '',
          ticketInvoiceNumber: form.controls.invoiceId.value,
          ticketInvoicePublicId: form.controls.invoicePublicId.value,
          ticketNote: '',
          ticketOnName: ticket['Ime i prezime'].toString().trim(),
          ticketPhone: '',
          ticketPrice: ticket['Cijena'],
          ticketRoundTrip: this.checkRoundTrip(ticket['Karta'].trim()),
          ticketStartDate: form.controls.invoiceDate.value,
          ticketStartTime: form.controls.invoiceDate.value,
          ticketType: this.getTicketType(ticket['Karta'], ticket['Cijena']),
          ticketValid: '6',
        };
      });

      form.controls.ticketsToStore.setValue(ticketsToStore);
    };
  }

  public escapeZero(ticketId: number): number {
    const numAsString: string = ticketId.toString();

    return parseInt(numAsString, 10);
  }

  public getBuslineId(lineStart: string, lineEnd: string): string {
    const start: string = this.correctCityName(lineStart).trim();
    const end: string = this.correctCityName(lineEnd).trim();

    if (this.buslines.find((line: IBusLine) => line.lineCityStart === start && line.lineCityEnd === end)) {
      return this.buslines.find((line: IBusLine) => line.lineCityStart === start && line.lineCityEnd === end)._id;
    }
    console.log(start + '  ---' + end);
  }

  public correctCityName(nameToCorrect: string): string {
    switch (nameToCorrect) {

      case 'Laktasi':
        return 'Laktaši';
      case 'Gradiska':
        return 'Gradiška';
      case 'Wizberg':
        return 'Würzburg';
      case 'Wizburg':
        return 'Würzburg';
      case 'Minhen':
        return 'München';
      case 'Ninberg':
        return 'Nürnberg';
      case 'Nirnberg':
        return 'Nürnberg';
      case 'Nurnberg':
        return 'Nürnberg';
      case 'Wurzburg':
        return 'Würzburg';
      case 'Ingolstat':
        return 'Ingolstadt';
      default:
        return nameToCorrect;
    }
  }

  public getTicketType(type: string, price: number): TicketType {
    if (type === 'Jedan smijer' || type === 'Jedan smjer' && price > 0) {
      return TicketType.classic;
    }

    if (type === 'Povratna' && price === 0) {
      return TicketType.return;
    }

    if (type === 'Povratna' && price > 0) {
      return TicketType.classic;
    }

    if (type === 'Agencijska') {
      return TicketType.agency;
    }

    if (type === 'Gratis') {
      return TicketType.gratis;
    }

    if (type !== 'Povratna' && type !== 'Jedan smijer' && type !== 'Jedan smjer' && type !== 'Agencijska' && type !== 'Gratis') {
      return TicketType.agency;
    }
  }

  public checkRoundTrip(type: any): boolean {
    switch (type) {
      case 'Jedan smijer' || 'Jedan smjer':
        return false;
      case 'Povratna':
        return true;
      case 'Agencijska':
        return false;
      case 'Gratis':
        return false;
      default:
        return false;
    }
  }

  public async createInvoice(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({ component: CreateInvoiceComponent });

    modal.onDidDismiss().then((data: any) => {
      if (data.role === 'save') {
        const newInvoice: IInvoice = {
          ...data.data,
          driversArray: data.data.invoiceDrivers.map((driver: any) => driver.name).join(', '),
        };
        this.invoices.unshift(newInvoice);
      }
    });

    return await modal.present();
  }
}
