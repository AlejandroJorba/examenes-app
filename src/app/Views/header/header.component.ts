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
  dniChecked: boolean = false;
  puntosChecked: boolean = false;

  logoFiles: File[] = [];

  constructor(private headerDataService: HeaderService)
  {
    const headerData = this.headerDataService.getHeaderData();
    if (headerData) {
      this.institucion = headerData.institucion;
      this.examen = headerData.examen;
      this.fecha = headerData.fecha == undefined || headerData.fecha == "" ? this.getFechaActual() : headerData.fecha;
      this.duracion = headerData.duracion;
      this.profesor = headerData.profesor;
      this.catedra = headerData.catedra;
      this.dniChecked = headerData.dniChecked;
      this.puntosChecked = headerData.puntosChecked;
      this.logoFiles = headerData.logoFile == undefined ? [] : headerData.logoFile;
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
      dniChecked: this.dniChecked,
      puntosChecked: this.puntosChecked,
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

  getFechaActual(): string {
    // Obtener la fecha actual
    const fechaActual = new Date();

    // Convertir la fecha actual a la zona horaria de Argentina
    const fechaArgentina = new Date(fechaActual.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));

    // Extraer los componentes de la fecha
    const anio = fechaArgentina.getFullYear();
    const mes = String(fechaArgentina.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaArgentina.getDate()).padStart(2, '0');

    // Formatear la fecha como YYYY-MM-DD
    return `${anio}-${mes}-${dia}`;
  }


}
