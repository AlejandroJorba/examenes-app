import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection } from 'firebase/firestore';
import { ToastComponent } from '../toast/toast.component';
import { ToastService } from '../../Services/ToastService';
import { Toast } from '../../Interfaces/Toast';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './contacto.component.html'
})
export class ContactoComponent {

  firestore: Firestore = inject(Firestore);
  toastService: ToastService = inject(ToastService);
  sugerenciaForm: FormGroup;
  toast: Toast = {message: "", type: "", active: false};

  constructor() {
    this.sugerenciaForm = new FormGroup({
      nombre: new FormControl(""),
      email: new FormControl(""),
      mensaje: new FormControl(""),
      fecha: new FormControl(new Date())
    })
  }

  enviarSugerencia() {
    const sugerencia = this.sugerenciaForm.value;
    const usersCollection = collection(this.firestore, 'sugerencias');
    addDoc(usersCollection, sugerencia)
      .then(() => {
        this.toastService.showToast({ type: "success", message: "¡La sugerencia se ha enviado con éxito! Gracias por tu aporte.", active: true });
        this.sugerenciaForm.reset();
      })
      .catch(() => {
        this.toastService.showToast({ type: "error", message: "No se pudo enviar la sugerencia, inténtalo nuevamente.", active: true });
      });

    this.sugerenciaForm.reset();
  }

}
