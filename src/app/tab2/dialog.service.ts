import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'any',
})
export class DialogService {
  public confirm(message?: string): Observable<boolean> {
    const confirmation: boolean = window.confirm(message || 'Jeste li sigurni?');

    return of(confirmation);
  }
}
