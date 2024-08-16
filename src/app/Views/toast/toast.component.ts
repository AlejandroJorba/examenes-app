import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from '../../Interfaces/Toast';
import { ToastService } from '../../Services/ToastService';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html'
})
export class ToastComponent implements OnInit{
  toast: Toast = {message: "", type: "", active: false};
  toastService: ToastService = inject(ToastService);

  ngOnInit(): void {
    this.toastService.getToast().subscribe((toast) => {
      this.toast = toast;
      if (toast) {
        //setTimeout(() => this.toast.active = false, 5000); // Oculta el toast después de 5 segundos
      }
    });
  }

  closeToast() {
    this.toast.active = false;
  }
  
}
