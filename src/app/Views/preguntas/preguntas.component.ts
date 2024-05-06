import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { Pregunta } from '../../Interfaces/Pregunta';
import * as XLSX from 'xlsx';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ExamService } from '../../Services/ExamenService';
import { HeaderComponent } from '../header/header.component';
import { Observable } from 'rxjs';
import { ShepherdService } from 'angular-shepherd';
import { offset } from '@floating-ui/dom';
import { HeaderService } from '../../Services/HeaderService';

@Component({
  selector: 'app-preguntas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatExpansionModule, HttpClientModule, FormsModule, HeaderComponent],
  templateUrl: './preguntas.component.html'
})
export class PreguntasComponent implements AfterViewInit {

  mapeoDificultad: { [key: string]: string } = {
    facil: 'Fácil',
    fácil: 'Fácil',
    media: 'Media',
    dificil: 'Difícil',
    difícil: 'Difícil',
  };
  tutorialSeen = localStorage.getItem('tutorialSeen');
  // Define el formulario para agregar preguntas
  questionForm: FormGroup;
  // Lista de preguntas agregadas
  preguntasList: Pregunta[] = [];
  dificultad: number = 1;
  preguntasPorExamen: number = 1;
  cantidadExamenes: number = 1;
  puntajeTotal: number = 0;
  criterioSeleccionado: string = 'questionsPerExam';
  cargandoPDF: boolean = false;
  // Estado para controlar la visibilidad del modal
  mostrarModal: boolean = false;

  // Variables para almacenar los datos del header
  institucion: string = '';
  examen: string = '';
  fecha: string = '';
  duracion: string = '';
  profesor: string = '';
  catedra: string = '';
  dniChecked: boolean = true;
  logoFiles: File[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient, private examService: ExamService, private headerDataService: HeaderService, private shepherdService: ShepherdService) {
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
  ngAfterViewInit(): void {

    this.shepherdService.defaultStepOptions = {
      cancelIcon: {
        enabled: true
      },
      scrollTo: { behavior: 'smooth', block: 'center' },
      when: {
        show: function () {
          // Aquí `this` se refiere al paso (`Step`) en cuestión
          // Obtenemos el índice del paso actual
          const idStep = this.id;

          // Si no es el primer paso, ejecuta el código
          if (idStep != "firstStep") {
            const footer = this.getElement()?.querySelector('.shepherd-footer');

            // Elimina todas las clases relacionadas
            footer?.classList.remove('single-button', 'multiple-buttons');
            footer?.classList.add('multiple-buttons');
          }
        }
      }

    };
    this.shepherdService.modal = true;
    this.shepherdService.confirmCancel = false;

    this.shepherdService.addSteps([
      {
        id: 'firstStep',
        text: 'Gracias por utilizar la aplicación y espero que te sea de utilidad, te voy a dar un recorrido breve para que aprendas a utilizarla',
        modalOverlayOpeningPadding: 10,
        floatingUIOptions: { middleware: [offset({ mainAxis: 30, crossAxis: 40 })] },
        buttons: [
          {
            text: 'Siguiente',
            action() {
              return this.next();
            }
          }
        ],
      },
      {
        text: `Acá están las opciones para modificar el membrete del examen, hace click para abrir el popup`,
        attachTo: { element: '#buttonModal', on: 'left' },
        modalOverlayOpeningPadding: 10,
        floatingUIOptions: { middleware: [offset({ mainAxis: 30, crossAxis: 40 })] },
        buttons: [
          {
            text: 'Anterior',
            action() {
              return this.back();
            }
          },
          {
            text: 'Siguiente',
            action: () => {
              this.mostrarModal = true;

              return setTimeout(() => {
                this.shepherdService.next();
              }, 1);
            }
          }
        ],
      },
      {
        text: `
        Estos son todos los campos que pueden modificarse en el membrete
        <br>
        <br>
        <strong>Institución</strong>: Nombre de la institución (opcional)
        <br>
        <br>
        <strong>Logos de la institución</strong>: Logos de la institución, pueden colocarse varios o ninguno (opcional)
        <br>
        <br>
        <strong>Examen</strong>: Nombre del examen a dictar (opcional)
        <br>
        <br>
        <strong>Fecha</strong>: Fecha en la que va a ser dictado el examen
        <br>
        <br>
        <strong>Duración</strong>: Duración del examen
        <br>
        <br>
        <strong>Profesor</strong>: Nombre del profesor
        <br>
        <br>
        <strong>Cátedra</strong>: Nombre de la cátedra o materia
        <br>
        <br>
        <strong>DNI Alumno</strong>: Si se selecciona figura el campo DNI en el membrete
        `,
        attachTo: { element: '#modal', on: 'left' },
        modalOverlayOpeningPadding: 10,
        floatingUIOptions: { middleware: [offset({ mainAxis: 30, crossAxis: 40 })] },
        buttons: [
          {
            text: 'Anterior',
            action: () => {
              this.mostrarModal = false;
              return this.shepherdService.back();
            }
          },
          {
            text: 'Siguiente',
            action: () => {
              this.mostrarModal = false;
              return this.shepherdService.next();
            }
          }
        ],
      },
      {
        text: `
        Acá se ingresan las preguntas
        <br>
        <br>
        El patrón es:
        <br> 
        <br>
        <strong>Pregunta</strong> - <strong>Puntaje</strong>  - <strong>Dificultad</strong>  (Fácil/Media/Difícil)
        <br>
        <strong>Preguntas</strong>  (opcional)
        <br> 
        <strong>Pulsar tecla enter</strong>
        <br>
        <br>
        <strong>IMPORTANTE</strong>:
        <br>
        - Si no se colocan respuestas se colocará la pregunta sola
        <br>
        - Cuando se ingrese una pregunta debe hacerse enter para ingresar la siguiente
        <br>
        - Debe separarse entre guiones (-) la pregunta con sus demás valores, ejemplo: Es hoy miércoles? - 10 - Fácil
        `,
        attachTo: { element: '#preguntasTextarea', on: 'right' },
        modalOverlayOpeningPadding: 10,
        floatingUIOptions: { middleware: [offset({ mainAxis: 30, crossAxis: 40 })] },
        buttons: [
          {
            text: 'Anterior',
            action: () => {
              this.mostrarModal = true;
              return setTimeout(() => {
                this.shepherdService.back();
              }, 1);
            }
          }, {
            text: 'Siguiente',
            action() {
              return this.next();
            }
          }
        ],
      },
      {
        text: 'Cuando tengas ingresadas las preguntas clickea en este botón para guardarlas',
        attachTo: { element: '#guardarPreguntas', on: 'right' },
        modalOverlayOpeningPadding: 10,
        floatingUIOptions: { middleware: [offset({ mainAxis: 30, crossAxis: 40 })] },
        buttons: [
          {
            text: 'Anterior',
            action() {
              return this.back();
            }
          },
          {
            text: 'Siguiente',
            action() {
              return this.next();
            }
          }
        ]
      },
      {
        text: `
        Acá van las cantidades que desees, si no se ingresan valores no se puede generar el PDF
        <br>
        <br>
        <strong>Cantidad de examenes</strong>: La cantidad de examenes a generar
        <br>
        <br>
        <strong>Cantidad de preguntas por examen</strong>: La cantidad de preguntas que tiene cada examen
        <br>
        <br>
        <strong>IMPORTANTE</strong>:
        <br>
        La cantidad de preguntas no puede ser mayor a la cantidad de preguntas ingresadas
        `,
        attachTo: { element: '#cantidades', on: 'right' },
        modalOverlayOpeningPadding: 10,
        floatingUIOptions: { middleware: [offset({ mainAxis: 30, crossAxis: 40 })] },
        buttons: [
          {
            text: 'Anterior',
            action() {
              return this.back();
            }
          },
          {
            text: 'Siguiente',
            action() {
              return this.next();
            }
          }
        ]
      },
      {
        text: 'Estos son los tres botones más importantes de la aplicación<br><br><strong>Verde</strong>: Descarga un excel con las preguntas del examen<br><br><strong>Amarillo</strong>: Sirve para cargar el excel que descargaste y no tengas que volver a escribir las preguntas<br><br><strong>Rojo</strong>: Genera el PDF con los exámenes',
        attachTo: { element: '#botones', on: 'right' },
        modalOverlayOpeningPadding: 10,
        floatingUIOptions: { middleware: [offset({ mainAxis: 30, crossAxis: 40 })] },
        buttons: [
          {
            text: 'Anterior',
            action() {
              return this.back();
            }
          },
          {
            text: 'Siguiente',
            action() {
              return this.next();
            }
          }
        ]
      },
      {
        text: 'De este otro lado van a estar listadas las preguntas que hayas agregado',
        attachTo: { element: '#listadoPreguntas', on: 'left' },
        modalOverlayOpeningPadding: 10,
        floatingUIOptions: { middleware: [offset({ mainAxis: 30, crossAxis: 40 })] },
        buttons: [
          {
            text: 'Anterior',
            action() {
              return this.back();
            }
          },
          {
            text: 'Siguiente',
            action() {
              return this.next();
            }
          }
        ]
      },
      {
        text: 'Éxitos y cualquier duda o sugerencia a alejandrojorba123@gmail.com',
        modalOverlayOpeningPadding: 10,
        floatingUIOptions: { middleware: [offset({ mainAxis: 30, crossAxis: 40 })] },
        buttons: [
          {
            text: 'Anterior',
            action() {
              return this.back();
            }
          },
          {
            text: 'Finalizar',
            action() {
              return this.next();
            }
          }
        ]
      },
    ]);

    const userAgent = navigator.userAgent;
    // Verifica si el userAgent contiene cadenas que indican un dispositivo móvil
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(userAgent);

    if (!this.tutorialSeen && !isMobile) {
      // Iniciar el tutorial
      this.shepherdService.start();
      localStorage.setItem('tutorialSeen', 'true');
    }
  }

  actualizarHeader(datos: any): void {
    // Actualizar las variables del componente con los datos recibidos del modal
    this.institucion = datos.institucion;
    this.examen = datos.examen;
    this.fecha = datos.fecha;
    this.duracion = datos.duracion;
    this.profesor = datos.profesor;
    this.catedra = datos.catedra;
    this.logoFiles = datos.logoFile;
    this.dniChecked = datos.dniChecked;
    // Cerrar el modal después de actualizar los datos
    this.mostrarModal = false;
  }

  formatDate(date: Date): string {
    // Crea un objeto de tipo Intl.DateTimeFormat para formatear la fecha en español
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Devuelve la fecha formateada en el formato deseado
    return formatter.format(date);
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

  // Función para normalizar la dificultad
  normalizarDificultad(difficulty: string): string {
    // Elimina los acentos y convierte a minúsculas
    return difficulty.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // Función para verificar si la dificultad coincide
  verificarDificultad(pregunta: any, expectedDifficulty: string): boolean {
    return this.normalizarDificultad(pregunta.dificultad) === expectedDifficulty;
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
    this.cargandoPDF = true;
    // Obtener los parámetros del examen
    const cantExamenes = this.cantidadExamenes;
    const cantPreguntas = this.preguntasPorExamen;
    const puntaje = this.puntajeTotal;
    const preguntas: Pregunta[] = this.preguntasList;
    // Generar exámenes utilizando el servicio
    const examenes = this.examService.generateExams(cantExamenes, cantPreguntas, puntaje, preguntas);
    const htmlDiv = document.createElement('div');

    // Iterar sobre cada examen
    for (let i = 0; i < examenes.length; i++) {
      const examen = examenes[i];
      const examenDiv = document.createElement('div');

      // Cargar el archivo HTML como plantilla
      const response = await this.http.get('assets/reporteExamen.html', { responseType: 'text' }).toPromise();
      examenDiv.innerHTML = response as string;


      const headerDiv = document.createElement('div');

      // Sección de información esencial
      const infoDiv = document.createElement('div');
      infoDiv.classList.add('header-info', 'text-right');

      // Sección de logo
      if (this.logoFiles?.length > 0) {

        infoDiv.style.borderTop = '2px solid #ccc'; // Estilo de borde inferior
        infoDiv.style.marginTop = '20px'; // Margen inferior

        // Crear el header con los logos
        headerDiv.classList.add('header-img');
        // Convertir cada archivo a base64
        Array.from(this.logoFiles).forEach(file => {
          this.convertFileToBase64(file).subscribe(base64String => {
            // Aquí puedes hacer lo que quieras con cada base64String
            // Por ejemplo, mostrar el logo en el documento
            const logoImg = document.createElement('img');
            logoImg.src = base64String;
            logoImg.width = 100;
            logoImg.height = 100;
            headerDiv.appendChild(logoImg); // Añadir al documento
          });
        });
      }

      // Nombre de la institución
      const universidadH1 = document.createElement('h1');
      universidadH1.textContent = `${this.institucion}`;
      universidadH1.classList.add('text-xl', 'font-bold');
      infoDiv.appendChild(universidadH1);

      // Información del examen
      const examenH2 = document.createElement('h2');
      examenH2.textContent = `${this.examen}`;
      infoDiv.appendChild(examenH2);

      // Fecha, duración y puntaje
      const fechaP = document.createElement('p');
      fechaP.innerHTML = `<strong>Fecha:</strong> ${this.formatDate(new Date(this.fecha))} | <strong>Duración:</strong> ${this.duracion} | <strong>Puntaje:</strong><span style="margin-left: 40px;"></span>  puntos`;
      infoDiv.appendChild(fechaP);

      // Instructor y código del curso
      const instructorP = document.createElement('p');
      instructorP.innerHTML = `<strong>Profesor:</strong> ${this.profesor} | <strong>Cátedra:</strong> ${this.catedra}`;
      infoDiv.appendChild(instructorP);

      // Nombre y DNI del alumno
      const alumnoP = document.createElement('p');
      if (this.dniChecked) alumnoP.innerHTML = `<strong>Nombre:</strong> <span style="margin-left: 240px;"></span>| <strong>DNI:</strong>`;
      else alumnoP.innerHTML = `<strong>Nombre:</strong>`;
      infoDiv.appendChild(alumnoP);


      // Añadir el headerDiv al htmlDiv
      examenDiv.insertBefore(infoDiv, examenDiv.firstChild);
      // Añadir el headerDiv al htmlDiv
      examenDiv.insertBefore(headerDiv, examenDiv.firstChild);

      // Obtener el contenedor de preguntas desde el HTML cargado
      const preguntasContainer = examenDiv.querySelector<HTMLElement>('#preguntasContainer');

      if (!preguntasContainer) {
        console.error('No se encontró el contenedor de preguntas en el HTML cargado.');
        continue;
      }

      // Limpia el contenedor de preguntas antes de llenarlo
      preguntasContainer.innerHTML = '';
      // Añadir la clase CSS para el salto de página antes de cada examen
      if (i > 0) {
        examenDiv.style.pageBreakBefore = 'always';
      }

      // Iterar sobre cada pregunta en el examen y añadirla al contenedor
      examen.forEach((pregunta: Pregunta, index: number) => {
        // Crea un div para la pregunta
        const preguntaDiv = document.createElement('div');
        preguntaDiv.classList.add('mb-6');

        // Añadir el título de la pregunta
        const preguntaTitulo = document.createElement('div');
        preguntaTitulo.classList.add('text-lg', 'font-semibold', 'mb-2');
        preguntaTitulo.textContent = `${index + 1}. ${pregunta.pregunta}`;

        // Crear un span para el puntaje de la pregunta
        const puntajeSpan = document.createElement('span');
        puntajeSpan.classList.add('text-sm', 'font-bold', 'text-gray-600', 'ml-2'); // Personaliza las clases según tus preferencias

        // Asigna el texto que contiene el puntaje de la pregunta
        puntajeSpan.textContent = ` (${pregunta.puntaje} pts)`;

        // Añadir el span con el puntaje al div del título de la pregunta
        preguntaTitulo.appendChild(puntajeSpan);

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
      htmlDiv.appendChild(examenDiv);
    }

    document.body.appendChild(htmlDiv);

    this.cargandoPDF = false;
    // Imprimir el examen (solo el contenido actual)
    await new Promise(r => setTimeout(r, 1000));
    document.title = this.institucion != "" ? `${this.examen}-${this.institucion}` : `${this.profesor}-${this.examen}`;
    window.print();
    htmlDiv.remove();
    document.title = 'EvaluAr';
  }

  convertFileToBase64(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();

      reader.onload = () => {
        // Cuando la conversión a base64 se completa, resuelve la promesa con el resultado
        const base64String = reader.result as string;
        observer.next(base64String);
        observer.complete();
      };

      reader.onerror = (e) => {
        // Si ocurre un error durante la lectura del archivo, rechaza la promesa
        observer.error(e);
      };

      reader.readAsDataURL(file);
    });
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
      const dificultadNormalizada = dificultad?.toLowerCase();
      const dificultadExacta = this.mapeoDificultad[dificultadNormalizada] || dificultad;

      // Crear un objeto Pregunta
      const nuevaPregunta: Pregunta = {
        pregunta: pregunta.trim(),
        puntaje: puntaje?.trim(),
        dificultad: dificultadExacta,
        respuesta: respuestas.map(respuesta => respuesta.trim()).filter(respuesta => respuesta !== ''),
      };

      // Agregar la pregunta a la lista
      preguntasList.push(nuevaPregunta);
    });

    this.questionForm.reset();
  }

}