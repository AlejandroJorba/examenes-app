import { inject, Injectable } from '@angular/core';
import { collectionData } from '@angular/fire/firestore';
import { addDoc, collection, deleteDoc, doc, Firestore, setDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  private firestore = inject(Firestore);

  // Obtener todos los documentos de una colección
  getSugerencias(): Observable<any[]> {
    const usersCollection = collection(this.firestore, 'sugerencias');
    return collectionData(usersCollection, { idField: 'id' });
  }

  // Agregar un nuevo documento
  addSugerencia(user: any) {
    const usersCollection = collection(this.firestore, 'sugerencias');
    return addDoc(usersCollection, user);
  }

  // Actualizar un documento existente
  updateSugerencia(id: string, user: any) {
    const userDoc = doc(this.firestore, `sugerencias/${id}`);
    return setDoc(userDoc, user);
  }

  // Eliminar un documento
  deleteSugerencia(id: string) {
    const userDoc = doc(this.firestore, `sugerencias/${id}`);
    return deleteDoc(userDoc);
  }
}
