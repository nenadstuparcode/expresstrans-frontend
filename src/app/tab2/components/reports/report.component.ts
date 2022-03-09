import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ModalController,
  Platform,
  ToastController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { BusLineService } from '@app/tab2/bus-line.service';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ITicket, TicketType } from '@app/tab1/ticket.interface';
import { SelectionModel } from '@angular/cdk/collections';
import { catchError, concatMap, filter, map, take, tap } from 'rxjs/operators';
import { IBusLine } from '@app/tab2/tab2.interface';
import { ICommonResponse } from '@app/services/user.interface';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { ReportService } from '@app/tab2/components/reports/report.service';
import { File } from '@ionic-native/file';
import { FileOpener } from '@ionic-native/file-opener';
import { saveAs } from 'file-saver';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-bus-lines',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) public paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('matTable') public matTable: MatTable<ITicket>;
  public bihImage: string = 'assets/images/bih.png';
  public deImage: string = 'assets/images/germany.png';
  public componentDestroyed$: Subject<void> = new Subject<void>();
  public dataLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public config: any = {
    title: 'izvještaji',
    icon: 'analytics-outline',
    description: 'Izvjestaji',
    color: '#E63135',
  };

  public pageNumber: number = 0;
  public resultsPerPage: number = 25;
  pageSizeOptions: number[] = [10, 25, 50, 100, 200, 300, 500, 1000, 2000];
  public ticketTotalCount: number = 0;

  public tickets: ITicket[] = [];
  public busLines: IBusLine[] = [];
  public activeSortProperty: string;
  public activeSortOption: number;

  public selectedRowIndex: number = -1;
  public displayedColumns: string[] = [
    'select',
    'position',
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

  public dataSource: MatTableDataSource<ITicket>;
  public selection: SelectionModel<ITicket> = new SelectionModel<ITicket>(true, []);
  public selected: string[] = [];
  public searchRangeForm: FormGroup;

  constructor(
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private router: Router,
    private busLineService: BusLineService,
    public toastController: ToastController,
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loadingController: LoadingController,
    private reportService: ReportService,
    private platform: Platform,
    private datePipe: DatePipe,
  ) {}

  public get TicketTypes(): typeof TicketType {
    return TicketType;
  }

  public ngOnInit(): void {
    this.searchRangeForm = this.fb.group({
      start: this.fb.control('2022-01-12T19:23:00+01:00', Validators.required),
      end: this.fb.control('2022-03-12T19:23:00+01:00', Validators.required),
    });

    this.getTickets('', this.pageNumber, this.resultsPerPage);
  }

  public highlight(row: any): void {
    this.selectedRowIndex = row._id;
  }

  public setDateStart(date: string): void {
    this.searchRangeForm.controls.start.setValue(date);
  }

  public setDateEnd(date: string): void {
    this.searchRangeForm.controls.end.setValue(date);
  }

  public calculateTotalTax(): number {
    let sum: number = 0;
    this.tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += ticket.returnTaxDE;
      }
    });

    return +sum.toFixed(2);
  }

  public calculateTotalPrice(): number {
    let sum: number = 0;
    this.tickets.forEach((ticket: ITicket) => {
      if (!this.checkSelection(ticket)) {
        sum += ticket.ticketPrice;
      }
    });

    return +sum.toFixed(2);
  }

  public getTickets(searchTerm: string, pageNumber: number, resultPerPage: number, event?: any): void {
    const startDate: string = this.searchRangeForm.controls.start.value;
    const endDate: string = this.searchRangeForm.controls.end.value;
    const sortByProp: string = this.activeSortProperty ? this.activeSortProperty : 'ticketStartDate';
    const sortOption: number = this.activeSortOption ? this.activeSortOption : -1;
    this.presentLoading('Učitavanje karti...').then(() => {
      this.busLineService
        .getBusLines()
        .pipe(
          take(1),
          filter((data: IBusLine[]) => !!data),
          tap((data: IBusLine[]) => (this.busLines = data)),
          // eslint-disable-next-line max-len
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
              ticketIdToShow: ticket.ticketType === 'classic' ? ticket.ticketClassicId : ticket.ticketId,
              position: index + 1 + this.pageNumber * this.resultsPerPage,
              busLineData: this.getBusLineData(ticket.ticketBusLineId),
              ticketPrice: ticket.ticketType === 'return' ? 0 : ticket.ticketPrice,
              totalKilometers: this.getTotalKilometers(ticket.ticketBusLineId),
              taxInDE: +this.taxInDE(ticket.ticketBusLineId).toFixed(2),
              taxCalculatedOne: ticket.ticketType === 'return' ? 0 : +this.taxCalculatedOne(ticket.ticketBusLineId, ticket.ticketRoundTrip).toFixed(2),
              taxCalculatedTwo: ticket.ticketType === 'return' ? 0 : +(this.taxCalculatedOne(ticket.ticketBusLineId, ticket.ticketRoundTrip) / 1.19).toFixed(2),
              returnTaxDE: ticket.ticketType === 'return' ? 0 : +(
                this.taxCalculatedOne(ticket.ticketBusLineId, ticket.ticketRoundTrip) -
                      this.taxCalculatedOne(ticket.ticketBusLineId, ticket.ticketRoundTrip) / 1.19
              ).toFixed(2),
            }));
          }),
          tap((data: ITicket[]) => {
            this.tickets = [...data];
            this.dataSource = new MatTableDataSource([...this.tickets]);

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

  public taxCalculatedOne(lineDataId: string, roundTrip: boolean): number {
    // eslint-disable-next-line no-underscore-dangle
    const selectedLine: IBusLine = this.busLines.find((line: IBusLine) => line._id === lineDataId);

    if (roundTrip) {
      // eslint-disable-next-line max-len
      return (
        (+selectedLine.deKilometers / +(selectedLine.deKilometers + selectedLine.bihKilometers + 579)) *
        +selectedLine.linePriceRoundTrip
      );
    } else {
      return (
        (+selectedLine.deKilometers / +(selectedLine.deKilometers + selectedLine.bihKilometers + 579)) *
        +selectedLine.linePriceOneWay
      );
    }
  }

  public taxInDE(lineDataId: string): number {
    // eslint-disable-next-line no-underscore-dangle
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

  public changePage(event: any): void {
    this.pageNumber = event.pageIndex;
    this.resultsPerPage = event.pageSize;
    this.getTickets('', this.pageNumber, this.resultsPerPage);
  }

  public async presentLoading(msg: string): Promise<void> {
    const loading: HTMLIonLoadingElement = await this.loadingController.create({ message: msg });
    await loading.present();
  }

  public sortData(event: Sort): void {
    this.activeSortOption = event.direction === 'asc' ? 1 : -1;
    this.activeSortProperty = event.active;
    this.getTickets('', this.pageNumber, this.resultsPerPage);
  }

  public printReport(): void {
    const ticketsToPrint: ITicket[] = this.tickets
      .filter((ticket: ITicket) => !this.selected.includes(ticket._id))
      .map((tick: ITicket) => {
        return {
          ...tick,
          ticketStartDate: this.datePipe.transform(tick.ticketStartDate, 'dd/MM/YYYY'),
        };
      });

    const columnsToDisplay: string[] = [
      'Broj Fakture',
      'Datum',
      'Smijer',
      'Ime i Prezime',
      'Linija',
      'Cijena',
      'Vrsta Karte',
      'Broj Karte',
      'BiH',
      'Tranzit',
      'DE',
      'Ukupno',
      '% DE',
      'Ukupno',
      'Osnovica DE',
      'Ukupno DE',
    ];

    this.reportService
      .printReport(ticketsToPrint, columnsToDisplay)
      .pipe(
        take(1),
        tap((response: ArrayBuffer) => {
          if (this.platform.is('android') || this.platform.is('iphone')) {
            try {
              File.writeFile(
                File.documentsDirectory,
                'izvjestaj.pdf',
                new Blob([response], { type: 'application/pdf' }),
                {
                  replace: true,
                },
              ).catch((error: Error) => throwError(error));

              File.writeFile(
                File.externalRootDirectory + '/Download',
                'izvjestaj.pdf',
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
            saveAs(file, 'izvjestaj.pdf');
          }
        }),
        tap(() => {
          this.loadingController.dismiss();
          FileOpener.open(File.externalRootDirectory + '/Downloads/' + 'izvjestaj.pdf', 'application/pdf');
        }),
        catchError((error: Error) => {
          this.loadingController.dismiss();

          return throwError(error);
        }),
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
