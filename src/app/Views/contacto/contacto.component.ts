import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection } from 'firebase/firestore';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './contacto.component.html'
})
export class ContactoComponent {

  firestore: Firestore = inject(Firestore);
  sugerenciaForm: FormGroup;

  constructor() {
    this.sugerenciaForm = new FormGroup({
      nombre: new FormControl(""),
      email: new FormControl(""),
      mensaje: new FormControl(""),
    })
  }

  enviarSugerencia() {
    const sugerencia = this.sugerenciaForm.value;
    const usersCollection = collection(this.firestore, 'sugerencias');
    addDoc(usersCollection, sugerencia);
    this.sugerenciaForm.reset();
  }

}
