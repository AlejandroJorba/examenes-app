import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Toast } from '../Interfaces/Toast';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toastSubject = new Subject<Toast>();

  getToast(): Observable<Toast> {
    return this.toastSubject.asObservable();
  }

  showToast(toast: Toast) {
    this.toastSubject.next(toast);
    setTimeout(() => this.toastSubject.next({ type: toast.type, message: toast.message, active: toast.active })); // Ocultar después de 3 segundos
  }
}
