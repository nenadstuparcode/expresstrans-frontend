import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { catchError, concatMap, filter, map, take, tap } from 'rxjs/operators';
import { IBusLine } from '@app/tab2/tab2.interface';
import { ICommonResponse } from '@app/services/user.interface';
import { ITicket, TicketType } from '@app/tab1/ticket.interface';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { LoadingController } from '@ionic/angular';
import { ReportService } from '@app/tab2/components/reports/report.service';
import { BusLineService } from '@app/tab2/bus-line.service';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';

export interface ILineOptions {
  lineName: string;
  lineCity1: string;
  lineCity2: string;
}

export interface ITableData {
  name: string;
  data: ITicket[];
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
    description: 'Izvještaj po gradovima',
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

  public campaignOne: FormGroup;

  constructor(
    public loadingController: LoadingController,
    public reportService: ReportService,
    public busLineService: BusLineService,
    public fb: FormBuilder,
  ) {}

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
    const sortOption: number = this.activeSortOption ? this.activeSortOption : -1;
    this.presentLoading('Učitavanje karti...').then(() => {
      this.busLineService
        .getBusLines()
        .pipe(
          take(1),
          filter((data: IBusLine[]) => !!data),
          tap((lines: IBusLine[]) => {
            this.lineOptions = lines
              .filter((lin: IBusLine) => lin.lineCountryStart === 'bih')
              .map(
                (line: IBusLine) =>
                  ({
                    lineName: `${line.lineCityStart} - ${line.lineCityEnd} - ${line.lineCityStart}`,
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
              ticketIdToShow: ticket.ticketType === 'classic' ? ticket.ticketClassicId : ticket.ticketId,
              ticketPrice: ticket.ticketType === 'return' ? 0 : ticket.ticketPrice,
              busLineData: this.getBusLineData(ticket.ticketBusLineId),
              totalKilometers: this.getTotalKilometers(ticket.ticketBusLineId),
              taxInDE: +this.taxInDE(ticket.ticketBusLineId).toFixed(2),
              taxCalculatedOne: ticket.ticketType === 'return' ? 0 : +this.taxCalculatedOne(ticket).toFixed(2),
              taxCalculatedTwo: ticket.ticketType === 'return' ? 0 : +(this.taxCalculatedOne(ticket) / 1.19).toFixed(2),
              returnTaxDE: ticket.ticketType === 'return' ? 0 : +(this.taxCalculatedOne(ticket) - this.taxCalculatedOne(ticket) / 1.19).toFixed(2),
            }));
          }),
          tap((data: ITicket[]) => {
            this.tickets = [...data];
            this.generalData = [];
            this.lineOptions.forEach((option: ILineOptions) => {
              this.generalData.push({
                name: option.lineName,
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
                    position: index + 1,
                  })),
              });
            });
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
