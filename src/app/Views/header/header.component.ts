import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderService } from '../../Services/HeaderService';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  @Output() guardarHeader = new EventEmitter<any>();
  @Output() cerrarModal = new EventEmitter<void>();

  // Variables para almacenar los datos del header
  institucion: string = '';
  examen: string = '';
  fecha: string = '';
  duracion: string = '';
  profesor: string = '';
  catedra: string = '';
  dniChecked: boolean = true;

  logoFiles: File[] = [];

  constructor(private headerDataService: HeaderService)
  {
    const headerData = this.headerDataService.getHeaderData();
    if (headerData) {
      this.institucion = headerData.institucion;
      this.examen = headerData.examen;
      this.fecha = headerData.fecha;
      this.duracion = headerData.duracion;
      this.profesor = headerData.profesor;
      this.catedra = headerData.catedra;
      this.dniChecked = headerData.dniChecked;
      this.logoFiles = headerData.logoFile;
    }

  }

  guardarDatosHeader() {
    const data = {
      institucion: this.institucion,
      examen: this.examen,
      fecha: this.fecha,
      duracion: this.duracion,
      profesor: this.profesor,
      catedra: this.catedra,
      logoFile: this.logoFiles,
      dniChecked: this.dniChecked
    };

    // Guardar los datos en el servicio
    this.headerDataService.setHeaderData(data);

    // Emitir los datos a través del evento `guardarHeader`
    this.guardarHeader.emit(data);

    // Cerrar el modal
    this.cerrarModal.emit();
  }

  
  onClose(): void {
    this.cerrarModal.emit(); // Usa emit() para emitir el evento
  }

  onLogoChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files && inputElement.files[0];

    if (file) {
      this.logoFiles.push(file);
    }
  }

}
