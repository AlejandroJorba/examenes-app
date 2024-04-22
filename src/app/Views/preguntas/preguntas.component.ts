import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { Pregunta } from '../../Interfaces/Pregunta';
import * as XLSX from 'xlsx';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { ExamService } from '../../Services/ExamenService';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-preguntas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatExpansionModule, HttpClientModule, FormsModule],
  templateUrl: './preguntas.component.html'
})
export class PreguntasComponent implements OnInit {
  // Define el formulario para agregar preguntas
  questionForm: FormGroup;
  // Lista de preguntas agregadas
  preguntasList: Pregunta[] = [];
  dificultad: number = 1;
  preguntasPorExamen: number = 0;
  cantidadExamenes: number = 0;
  constructor(private fb: FormBuilder, private http: HttpClient, private examService: ExamService) {
    const valorInicialPreguntas = `
    Pregunta 1 - 10 - fácil
    Respuesta 1.1
    Respuesta 1.2
    
    Pregunta 2 - 20 - media
    Respuesta 2.1
    Respuesta 2.2
    Respuesta 2.3
`;

    // Inicializa el formulario para agregar preguntas
    this.questionForm = this.fb.group({
      preguntasTextarea: [valorInicialPreguntas, [Validators.required]], // `textarea` para preguntas
    });
  }

  ngOnInit() {
  }

  updateDificultad($event: any): string {
    this.dificultad = $event.target.value;
    return this.dificultad.toString();
  }
  // Crea un nuevo FormGroup para una respuesta
  createRespuesta(): FormGroup {
    return this.fb.group({
      respuesta: ['', Validators.required],
    });
  }

  // Añade una nueva respuesta al FormArray de respuestas
  addRespuesta() {
    const respuestasArray = this.questionForm.get('respuestas') as FormArray;
    respuestasArray.push(this.createRespuesta());
  }

  // Elimina una respuesta por índice
  deleteRespuesta(index: number) {
    const respuestasArray = this.questionForm.get('respuestas') as FormArray;
    respuestasArray.removeAt(index);
  }

  convertToExcelData() {
    const excelData: { Pregunta: string; Respuestas: string; }[] = [];

    this.preguntasList.forEach((pregunta) => {
      // Aplanar los datos de pregunta, respuestas y respuestas correctas
      const preguntaRow = {
        Pregunta: pregunta.pregunta,
        Puntaje: pregunta.puntaje,
        Dificultad: pregunta.dificultad,
        Respuestas: pregunta.respuesta.join(', ')
      };

      excelData.push(preguntaRow);
    });

    return excelData;
  }

  downloadExcel() {
    // Convierte preguntasList a un formato compatible con Excel
    const excelData = this.convertToExcelData();

    // Crea una hoja de trabajo a partir de los datos
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Crea un libro de trabajo y añade la hoja de trabajo
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Preguntas');

    // Descarga el archivo Excel
    XLSX.writeFile(workbook, 'preguntasList.xlsx');
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.loadExcelFile(file);
    }
  }

  loadExcelFile(file: File) {
    // Crea un lector de archivos
    const reader = new FileReader();

    reader.onload = (event) => {
      this.preguntasList = [];
      const binaryString = event.target?.result;
      if (binaryString) {
        // Lee el archivo Excel
        const workbook = XLSX.read(binaryString, { type: 'binary' });

        // Asume que los datos están en la primera hoja
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convierte la hoja de cálculo a un array de objetos
        const excelData = XLSX.utils.sheet_to_json(sheet);

        // Transforma los datos a Pregunta[] y los agrega a preguntasList
        this.preguntasList = excelData.map((row: any) => ({
          pregunta: row.Pregunta,
          dificultad: row.Dificultad,
          puntaje: row.Puntaje,
          respuesta: row.Respuestas.split(', ').map((r: string) => r.trim()),
        }));
      }
    };

    // Lee el archivo como un binary string
    reader.readAsBinaryString(file);
  }


public async generarPDF(): Promise<void> {
    try {
        // Obtener los parámetros del examen
        const cantExamenes = this.cantidadExamenes;
        const cantPreguntas = this.preguntasPorExamen;
        const preguntas: Pregunta[] = this.preguntasList;
        const body = document.body.innerHTML;
        // Generar exámenes utilizando el servicio
        const examenes = this.examService.generateExams(cantExamenes, cantPreguntas, preguntas);

        // Iterar sobre cada examen
        for (let i = 0; i < examenes.length; i++) {
            const examen = examenes[i];

            // Cargar el archivo HTML como plantilla
            const response = await this.http.get('assets/reporteExamen.html', { responseType: 'text' }).toPromise();
            const htmlContent = response as string;

            // Crear un elemento div para cargar el HTML
            const htmlDiv = document.createElement('div');
            htmlDiv.innerHTML = htmlContent;

            // Obtener el contenedor de preguntas desde el HTML cargado
            const preguntasContainer = htmlDiv.querySelector<HTMLElement>('#preguntasContainer');

            if (!preguntasContainer) {
                console.error('No se encontró el contenedor de preguntas en el HTML cargado.');
                continue;
            }

            // Limpia el contenedor de preguntas antes de llenarlo
            preguntasContainer.innerHTML = '';
            // Añadir la clase CSS para el salto de página antes de cada examen
            if (i > 0) {
              htmlDiv.style.pageBreakBefore = 'always';
          }

            // Iterar sobre cada pregunta en el examen y añadirla al contenedor
            examen.forEach((pregunta: Pregunta, index: number) => {
                // Crea un div para la pregunta
                const preguntaDiv = document.createElement('div');
                preguntaDiv.classList.add('mb-6');

                // Añadir el título de la pregunta
                const preguntaTitulo = document.createElement('div');
                preguntaTitulo.classList.add('text-lg', 'font-semibold', 'mb-2');
                preguntaTitulo.textContent = `${pregunta.pregunta}`;
                preguntaDiv.appendChild(preguntaTitulo);

                // Crear lista de respuestas y añadirlas al div
                const respuestasList = document.createElement('ul');
                respuestasList.classList.add('space-y-2');
                pregunta.respuesta.forEach((respuesta, i) => {
                    const respuestaItem = document.createElement('li');
                    respuestaItem.classList.add('flex', 'items-center');

                    // Crear checkbox para la respuesta
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `q${index + 1}a${i + 1}`;
                    checkbox.name = `q${index + 1}`;
                    checkbox.value = respuesta;
                    checkbox.classList.add('mr-2');

                    // Crear etiqueta para la respuesta
                    const respuestaLabel = document.createElement('label');
                    respuestaLabel.htmlFor = checkbox.id;
                    respuestaLabel.textContent = respuesta;

                    // Añadir checkbox y etiqueta al elemento de lista
                    respuestaItem.appendChild(checkbox);
                    respuestaItem.appendChild(respuestaLabel);
                    respuestasList.appendChild(respuestaItem);
                });

                // Añadir lista de respuestas al div de la pregunta
                preguntaDiv.appendChild(respuestasList);
                preguntasContainer.appendChild(preguntaDiv);
            });

            // Añadir el div HTML al documento para imprimirlo
            document.body.appendChild(htmlDiv);
            
          }
          // Imprimir el examen (solo el contenido actual)
          window.print();
          document.body.innerHTML = body;
    } catch (error) {
        console.error('Error al generar el PDF:', error);
    }
}

  onSubmit() {
    const formData = this.questionForm.value;

    // Dividir el contenido del textarea por dobles saltos de línea
    const preguntasText = formData.preguntasTextarea.trim().split(/\n\s*\n/);

    const preguntasList: Pregunta[] = [];

    preguntasText.forEach((preguntaTexto: string) => {
      // Dividir la pregunta y sus respuestas por saltos de línea
      const lines = preguntaTexto.split('\n');

      // Extraer la primera línea (contiene la pregunta, puntaje y dificultad)
      const [preguntaHeader, ...respuestas] = lines;

      // Dividir la primera línea por guion
      const [pregunta, puntaje, dificultad] = preguntaHeader.split(' - ');

      // Crear un objeto Pregunta
      const nuevaPregunta: Pregunta = {
        pregunta: pregunta.trim(),
        puntaje: puntaje.trim(),
        dificultad: dificultad.trim(),
        respuesta: respuestas.map(respuesta => respuesta.trim()).filter(respuesta => respuesta !== ''),
      };

      // Agregar la pregunta a la lista
      this.preguntasList.push(nuevaPregunta);
    });
    
    this.questionForm.reset();
    console.log('Preguntas procesadas:', preguntasList);
    // Puedes proceder a hacer algo con la lista de preguntas aquí
  }

}