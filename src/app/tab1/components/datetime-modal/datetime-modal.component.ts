import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-datetime-modal',
  templateUrl: './datetime-modal.component.html',
  styleUrls: ['./datetime-modal.component.scss'],
})
export class DatetimeModalComponent {
  @ViewChild('popoverDate') public popoverDate: any;
  public today: Date = new Date();
  public myToday: string = new Date(
    this.today.getFullYear(),
    this.today.getMonth(),
    this.today.getDate(),
    0,
    0,
    0,
  ).toISOString();

  public dateToSend: string;
  constructor(public dialogRef: MatDialogRef<DatetimeModalComponent>, @Inject(MAT_DIALOG_DATA) public data: string) {}

  public setDate(date: string): void {
    this.dateToSend = date;
  }

  public confirmDate(date: string): void {
    this.popoverDate.confirm();
    setTimeout(() => {
      this.dialogRef.close(date);
    }, 300);
  }

  public onNoClick(): void {
    this.popoverDate.cancel();
    setTimeout(() => {
      this.dialogRef.close();
    }, 300);
  }
}
