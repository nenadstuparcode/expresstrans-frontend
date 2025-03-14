import { Component, OnDestroy, OnInit, TrackByFunction, ViewChild } from "@angular/core";
import { catchError, concatMap, filter, map, take, tap } from 'rxjs/operators';
import { IBusLine } from '@app/tab2/tab2.interface';
import { ICommonResponse } from '@app/services/user.interface';
import { ITicket, TicketType } from '@app/tab1/ticket.interface';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { LoadingController, Platform } from '@ionic/angular';
import { ReportService } from '@app/tab2/components/reports/report.service';
import { BusLineService } from '@app/tab2/bus-line.service';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { File } from '@ionic-native/file';
import { FileOpener } from '@ionic-native/file-opener';
import { saveAs } from 'file-saver';
import { DatePipe } from '@angular/common';

export interface ILineOptions {
  lineName: string;
  lineCity1: string;
  lineCity2: string;
}

export interface ITableData {
  name: string;
  data: ITicket[];
  priceTotal: number;
  bihTotal: number;
  deTotal: number;
  tranzitTotal: number;
  kmTotal: number;
  taxCalculatedOne: number;
  taxCalculatedTwo: number;
  taxDeTotal: number;
  toShow?: boolean;
}

export interface IGeneral {
  name: string;
  data: ITableData[];
  priceTotal?: number;
  bihTotal?: number;
  deTotal?: number;
  tranzitTotal?: number;
  kmTotal?: number;
  taxCalculatedOne?: number;
  taxCalculatedTwo?: number;
  taxDeTotal?: number;
  totalPassengers?: number;
  toShow?: boolean;
}

export interface ITotals {
  totalPassengers: number;
  totalPrice: number;
  totalKmBih: number;
  totalKmTranzit: number;
  totalKmDe: number;
  totalKm: number;
  totalTaxDe: string;
  totalTaxCalculatedOne: number;
  totalTaxCalculatedTwo: number;
  totalTaxReturn: number;
}

export interface IFinals {
  calc1: number;
}

@Component({
  selector: 'app-reports-city',
  templateUrl: './reports-city.component.html',
  styleUrls: ['./reports-city.component.scss'],
})
export class ReportsCityComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public config: any = {
    title: 'izvjestaj-gradovi',
    icon: 'business-outline',
    description: 'Izvještaj bez gradova',
    color: '#E63135',
  };

  public dataSource: MatTableDataSource<ITicket>;

  public tickets: ITicket[] = [];
  public busLines: IBusLine[] = [];
  public ticketTotalCount: number = 0;
  public bihImage: string = 'assets/images/bih.png';
  public deImage: string = 'assets/images/germany.png';
  public displayedColumns: string[] = [
    'select',
    'position',
    'ticketInvoiceNumber',
    'ticketId',
    'lineCountryStart',
    'ticketStartDate',
    'ticketOnName',
    'ticketRoundTrip',
    'busLineData',
    'ticketPrice',
    'bihKilometers',
    'tranzitKilometers',
    'deKilometers',
    'totalKilometers',
    'taxDE',
    'taxCalculatedOne',
    'taxCalculatedTwo',
    'taxReturn',
  ];

  public monthNames: string[] = [
    'Januar',
    'Februar',
    'Mart',
    'April',
    'Maj',
    'Jun',
    'Jul',
    'August',
    'Septembar',
    'Oktobar',
    'Novembar',
    'Decembar',
  ];

  public displayedColumnsTotal: string[] = [
    'passengers',
    'totalTicketPrice',
    'totalBihKilometers',
    'totalTranzitKilometers',
    'totalDeKilometers',
    'totalKilometers',
    'totalTaxDE',
    'totalTaxCalculatedOne',
    'totalTaxCalculatedTwo',
    'totalTaxReturn',
  ];

  public dataLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public selection: SelectionModel<ITicket> = new SelectionModel<ITicket>(true, []);
  public selected: string[] = [];
  public activeSortProperty: string = '';
  public activeSortOption: number;
  public lineOptions: ILineOptions[] = [];

  public generalData: ITableData[] = [];

  public general: IGeneral[] = [
    {
      name: 'Doboj',
      data: [],
    },
    {
      name: 'Derventa',
      data: [],
    },
    {
      name: 'Prnjavor',
      data: [],
    },
    {
      name: 'Banja Luka',
      data: [],
    },
    {
      name: 'Laktaši',
      data: [],
    },
    {
      name: 'Gradiška',
      data: [],
    },
  ];

  public campaignOne: FormGroup;

  constructor(
    public loadingController: LoadingController,
    public reportService: ReportService,
    public busLineService: BusLineService,
    public fb: FormBuilder,
    public platform: Platform,
    public datePipe: DatePipe,
  ) {}

  public trackByFn(index, item): TrackByFunction<any> {
    return item.id; // Use the 'id' property as the unique identifier
  }

  public get TicketTypes(): typeof TicketType {
    return TicketType;
  }

  public initializeRangePicker(): void {
    const today: Date = new Date();
    const month: number = today.getMonth();
    const year: number = today.getFullYear();

    this.campaignOne = new FormGroup({
      start: new FormControl(new Date(year, month, 1).toISOString()),
      end: new FormControl(new Date(year, month + 1, 1).toISOString()),
    });
  }

  public ngOnInit(): void {
    this.initializeRangePicker();
    this.getTickets('', 0, 2000);
  }

  public selectCheckbox(row: ITicket): void {
    if (!this.checkSelection(row)) {
      this.selected.push(row._id);
    } else {
      this.selected = [...this.selected.filter((id: string) => id !== row._id)];
    }
  }

  public checkSelection(selectedTicket: ITicket): boolean {
    return this.selected.some((id: string) => id === selectedTicket._id);
  }

  public getTickets(searchTerm: string, pageNumber: number, resultPerPage: number, event?: any): void {
    const startDate: string = this.campaignOne.controls.start.value;
    const endDate: string = this.campaignOne.controls.end.value;
    const sortByProp: string = this.activeSortProperty ? this.activeSortProperty : 'ticketStartDate';
    const sortOption: number = this.activeSortOption ? this.activeSortOption : 1;
    this.presentLoading('Učitavanje karti...').then(() => {
      this.busLineService
        .getBusLines()
        .pipe(
          take(1),
          filter((data: IBusLine[]) => !!data),
          tap((lines: IBusLine[]) => {
            const date: Date = new Date(this.campaignOne.controls.start.value);
            const monthName: string = this.monthNames[date.getMonth()];
            this.lineOptions = lines
              .filter((lin: IBusLine) => lin.lineCountryStart === 'bih')
              .map(
                (line: IBusLine) =>
                  ({
                    lineName: `${line.lineCityStart} - ${line.lineCityEnd} - ${line.lineCityStart} ${monthName}`,
                    lineCity1: line.lineCityStart,
                    lineCity2: line.lineCityEnd,
                  } as ILineOptions),
              );
          }),
          tap((data: IBusLine[]) => (this.busLines = data)),
          concatMap(() =>
            this.reportService.reportTickets({
              searchTerm,
              pageNumber,
              resultPerPage,
              startDate,
              endDate,
              sortByProp,
              sortOption,
            }),
          ),
          filter((data: ICommonResponse<ITicket[]>) => !!data),
          map((data: ICommonResponse<ITicket[]>) => {
            this.ticketTotalCount = data.count;

            return data.data.map((ticket: ITicket, index: number) => ({
              ...ticket,
              position: index + 1,
              ticketIdToShow: ticket.ticketType === 'classic' ? `No.0${ticket.ticketClassicId}` : ticket.ticketId,
              ticketPrice: ticket.ticketType === 'return' ? 0 : ticket.ticketPrice,
              busLineData: this.getBusLineData(ticket.ticketBusLineId),
              totalKilometers: this.getTotalKilometers(ticket.ticketBusLineId),
              taxInDE: +this.taxInDE(ticket.ticketBusLineId).toFixed(6),
              taxCalculatedOne: ticket.ticketType === 'return' ? 0 : +this.taxCalculatedOne(ticket).toFixed(2),
              taxCalculatedTwo: ticket.ticketType === 'return' ? 0 : +(this.taxCalculatedOne(ticket) / 1.19).toFixed(2),
              returnTaxDE:
                ticket.ticketType === 'return' ?
                  0 :
                  +(this.taxCalculatedOne(ticket) - this.taxCalculatedOne(ticket) / 1.19).toFixed(2),
            }))
          }),
          tap((data: ITicket[]) => {

            this.tickets = [...data];
            this.generalData = [];
            this.calculateInit();
            this.dataSource = new MatTableDataSource([...this.tickets]);
            this.dataSource.sort = this.sort;

            if (event) {
              event.target.complete();
            }

            this.loadingController.dismiss();
          }),
          catchError((err: Error) => {
            if (event) {
              event.target.complete();
            }

            this.loadingController.dismiss();

            return throwError(err);
          }),
        )
        .subscribe();
    });
  }

  public getCityTickets(city: string): ITicket[] {
    return this.tickets.filter(
      (ticket: ITicket) => ticket.busLineData.lineCityStart === city || ticket.busLineData.lineCityEnd === city,
    );
  }

  public getGeneral(): IGeneral[] {
    return [
      {
        name: 'Doboj',
        data: [],
      },
      {
        name: 'Derventa',
        data: [],
      },
      {
        name: 'Prnjavor',
        data: [],
      },
      {
        name: 'Banja Luka',
        data: [],
      },
      {
        name: 'Laktaši',
        data: [],
      },
      {
        name: 'Gradiška',
        data: [],
      },
    ];
  }

  public calculateInit(): void {
    this.general = this.getGeneral();
    this.lineOptions.forEach((option: ILineOptions) => {
      const selectedCity: IGeneral = this.general.find(
        (city: IGeneral) => city.name === option.lineCity1 || city.name === option.lineCity2,
      );

      selectedCity.data.push({
        name: option.lineName,
        priceTotal: this.calculateTotalPrice(this.getLineTickets(option)),
        bihTotal: this.calculateTotalBih(this.getLineTickets(option)),
        deTotal: this.calculateTotalDe(this.getLineTickets(option)),
        tranzitTotal: this.calculateTotalTranzit(this.getLineTickets(option)),
        kmTotal: this.calculateTotalKilometers(this.getLineTickets(option)),
        taxCalculatedOne: this.calculateTotalTaxOne(this.getLineTickets(option)),
        taxCalculatedTwo: this.calculateTotalTaxTwo(this.getLineTickets(option)),
        taxDeTotal: this.calculateTotalTax(this.getLineTickets(option)),
        data: this.tickets
          .filter(
            (ticket: ITicket) =>
              (ticket.busLineData.lineCityStart === option.lineCity1 &&
                ticket.busLineData.lineCityEnd === option.lineCity2) ||
              (ticket.busLineData.lineCityStart === option.lineCity2 &&
                ticket.busLineData.lineCityEnd === option.lineCity1),
          )
          .map((tick: ITicket, index: number) => ({
            ...tick,
            ticketStartDate: this.datePipe.transform(tick.ticketStartDate, 'dd/MM/YYYY'),
            position: index + 1,
          })),
      });

      selectedCity.bihTotal = this.calculateTotalBih(this.getCityTickets(selectedCity.name));
      selectedCity.deTotal = this.calculateTotalDe(this.getCityTickets(selectedCity.name));
      selectedCity.tranzitTotal = this.calculateTotalTranzit(this.getCityTickets(selectedCity.name));
      selectedCity.kmTotal = this.calculateTotalKilometers(this.getCityTickets(selectedCity.name));
      selectedCity.priceTotal = this.calculateTotalPrice(this.getCityTickets(selectedCity.name));
      selectedCity.taxCalculatedOne = this.calculateTotalTaxOne(this.getCityTickets(selectedCity.name));
      selectedCity.taxCalculatedTwo = this.calculateTotalTaxTwo(this.getCityTickets(selectedCity.name));
      selectedCity.taxDeTotal = this.calculateTotalTax(this.getCityTickets(selectedCity.name));
      selectedCity.totalPassengers = this.calculateTotalPassengers(this.getCityTickets(selectedCity.name));
    });
  }

  public calculateBeforePrint(): IGeneral[] {
    const generalToPrint: IGeneral[] = [...this.getGeneral()];
    this.lineOptions.forEach((option: ILineOptions) => {
      const selectedCity: IGeneral = generalToPrint.find(
        (city: IGeneral) => city.name === option.lineCity1 || city.name === option.lineCity2,
      );

      selectedCity.data.push({
        name: option.lineName,
        priceTotal: this.calculateTotalPrice(this.getLineTickets(option)),
        bihTotal: this.calculateTotalBih(this.getLineTickets(option)),
        deTotal: this.calculateTotalDe(this.getLineTickets(option)),
        tranzitTotal: this.calculateTotalTranzit(this.getLineTickets(option)),
        kmTotal: this.calculateTotalKilometers(this.getLineTickets(option)),
        taxCalculatedOne: this.calculateTotalTaxOne(this.getLineTickets(option)),
        taxCalculatedTwo: this.calculateTotalTaxTwo(this.getLineTickets(option)),
        taxDeTotal: this.calculateTotalTax(this.getLineTickets(option)),
        data: this.tickets
          .filter(
            (ticket: ITicket) =>
              (ticket.busLineData.lineCityStart === option.lineCity1 &&
                ticket.busLineData.lineCityEnd === option.lineCity2) ||
              (ticket.busLineData.lineCityStart === option.lineCity2 &&
                ticket.busLineData.lineCityEnd === option.lineCity1),
          ).filter((tic: ITicket) => !this.checkSelection(tic))
          .map((tick: ITicket, index: number) => ({
            ...tick,
            ticketStartDate: this.datePipe.transform(tick.ticketStartDate, 'dd/MM/YYYY'),
            position: index + 1,
          })),
      });

      selectedCity.bihTotal = this.calculateTotalBih(this.getCityTickets(selectedCity.name));
      selectedCity.deTotal = this.calculateTotalDe(this.getCityTickets(selectedCity.name));
      selectedCity.tranzitTotal = this.calculateTotalTranzit(this.getCityTickets(selectedCity.name));
      selectedCity.kmTotal = this.calculateTotalKilometers(this.getCityTickets(selectedCity.name));
      selectedCity.priceTotal = this.calculateTotalPrice(this.getCityTickets(selectedCity.name));
      selectedCity.toShow = this.calculateTotalPrice(this.getCityTickets(selectedCity.name)) > 0;
      selectedCity.taxCalculatedOne = this.calculateTotalTaxOne(this.getCityTickets(selectedCity.name));
      selectedCity.taxCalculatedTwo = this.calculateTotalTaxTwo(this.getCityTickets(selectedCity.name));
      selectedCity.taxDeTotal = this.calculateTotalTax(this.getCityTickets(selectedCity.name));
      selectedCity.totalPassengers = this.calculateTotalPassengers(this.getCityTickets(selectedCity.name));
    });

    return generalToPrint;
  }

  public printReport(): void {

    this.presentLoading('Printanje PDF-a...').then(() => {
      const finals: IFinals = {
        calc1: +(this.calculateTotalPrice(this.tickets) - this.calculateTotalTaxOne(this.tickets)).toFixed(2),
      };

      const totals: ITotals = {
        totalPassengers: this.calculateTotalPassengers(this.tickets),
        totalKm: this.calculateTotalKilometers(this.tickets),
        totalKmBih: this.calculateTotalBih(this.tickets),
        totalKmDe: this.calculateTotalDe(this.tickets),
        totalKmTranzit: this.calculateTotalTranzit(this.tickets),
        totalPrice: this.calculateTotalPrice(this.tickets),
        totalTaxDe: '---',
        totalTaxCalculatedOne: this.calculateTotalTaxOne(this.tickets),
        totalTaxCalculatedTwo: this.calculateTotalTaxTwo(this.tickets),
        totalTaxReturn: this.calculateTotalTax(this.tickets),
      };
      const date: Date = new Date(this.campaignOne.controls.start.value);
      const monthName: string = this.monthNames[date.getMonth()].toUpperCase();
      const year: string = date.getFullYear().toString().toUpperCase();
      const printData: IGeneral[] = this.calculateBeforePrint();
      this.reportService
        .printReport([...printData], monthName, year, totals, finals)
        .pipe(
          take(1),
          tap((response: ArrayBuffer) => {
            if (this.platform.is('android') || this.platform.is('iphone')) {
              try {
                File.writeFile(
                  File.documentsDirectory,
                  `izvjestaj_${monthName}_${year}.pdf`,
                  new Blob([response], { type: 'application/pdf' }),
                  {
                    replace: true,
                  },
                ).catch((error: Error) => throwError(error));

                File.writeFile(
                  File.externalRootDirectory,
                  `izvjestaj_${monthName}_${year}.pdf`,
                  new Blob([response], { type: 'application/pdf' }),
                  {
                    replace: true,
                  },
                ).catch((error: Error) => throwError(error));
              } catch (err) {
                throwError(err);
              }
            } else {
              const file: Blob = new Blob([response], { type: 'application/pdf' });
              const fileURL: string = URL.createObjectURL(file);
              window.open(fileURL);
              saveAs(file, `izvjestaj_${monthName}_${year}.pdf`);
            }
          }),
          tap(() => {
            this.loadingController.dismiss();
            FileOpener.open(File.externalRootDirectory + `izvjestaj_${monthName}_${year}.pdf`, 'application/pdf');
          }),
          catchError((error: Error) => {
            this.loadingController.dismiss();

            return throwError(error);
          }),
        )
        .subscribe();
    }).catch((error: Error) => {
      this.loadingController.dismiss();

      return throwError(error);
    });
  }

  public getLineTickets(option: ILineOptions): ITicket[] {
    return this.tickets.filter(
      (ticket: ITicket) =>
        (ticket.busLineData.lineCityStart === option.lineCity1 &&
          ticket.busLineData.lineCityEnd === option.lineCity2) ||
        (ticket.busLineData.lineCityStart === option.lineCity2 && ticket.busLineData.lineCityEnd === option.lineCity1),
    );
  }

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingController.create({ message: msg });
    await loading.present();
  }

  public calculateTotalBih(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += ticket.busLineData.bihKilometers;
      }
    });

    return +sum.toFixed(2);
  }

  public calculateTotalTranzit(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += 579;
      }
    });

    return +sum.toFixed(2);
  }

  public calculateTotalPassengers(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += 1;
      }
    });

    return +sum.toFixed(2);
  }

  public calculateTotalKilometers(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += ticket.totalKilometers;
      }
    });

    return +sum.toFixed(2);
  }

  public calculateTotalTaxOne(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += ticket.taxCalculatedOne;
      }
    });

    return +sum.toFixed(2);
  }

  public calculateTotalTaxTwo(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += ticket.taxCalculatedTwo;
      }
    });

    return +sum.toFixed(2);
  }

  public calculateTotalDe(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += ticket.busLineData.deKilometers;
      }
    });

    return +sum.toFixed(2);
  }

  public calculateTotalTax(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += ticket.returnTaxDE;
      }
    });

    return +sum.toFixed(2);
  }

  public calculateTotalPrice(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += ticket.ticketPrice;
      }
    });

    return +sum.toFixed(2);
  }

  public taxCalculatedOne(ticket: ITicket): number {
    const selectedLine: IBusLine = this.busLines.find((line: IBusLine) => line._id === ticket.ticketBusLineId);

    return (
      (+selectedLine.deKilometers / +(selectedLine.deKilometers + selectedLine.bihKilometers + 579)) *
      +ticket.ticketPrice
    );
  }

  public taxInDE(lineDataId: string): number {
    const selectedLine: IBusLine = this.busLines.find((line: IBusLine) => line._id === lineDataId);

    return +selectedLine.deKilometers / +(selectedLine.deKilometers + selectedLine.bihKilometers + 579).toFixed(2);
  }

  public getTotalKilometers(lineDataId: string): number {
    const selectedLine: IBusLine = this.busLines.find((line: IBusLine) => line._id === lineDataId);

    return selectedLine.deKilometers + selectedLine.bihKilometers + 579;
  }

  public getBusLineData(busLineId: string): IBusLine {
    return this.busLines.find((line: IBusLine) => line._id === busLineId);
  }

  public getTicketsLength(tickets: ITicket[]): number {
    let sum: number = 0;
    tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += 1;
      }
    });

    return +sum;
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
