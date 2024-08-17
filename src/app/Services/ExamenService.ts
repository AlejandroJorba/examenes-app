import { Injectable } from '@angular/core';
import { Pregunta } from '../Interfaces/Pregunta';

@Injectable({
    providedIn: 'root',
})
export class ExamService {


    // Genera exámenes utilizando un método actualizado
    generateExams(numExams: number, preguntasPorExamen: number, puntaje: number, preguntas: Pregunta[]): any[] {
        const exams: any[] = [];
        // Generar la cantidad de exámenes especificada

        if (puntaje != 0) {
            for (let i = 0; i < numExams; i++) {
                let preguntasSeleccionadas: Pregunta[] = [];
                let puntajeTotal: number = 0;
                // Seleccionar preguntas de forma aleatoria hasta alcanzar el número deseado
                while (puntajeTotal < puntaje) {
                    // Verificar que hay preguntas disponibles
                    if (preguntas.length === 0) {
                        break;
                    }

                    // Seleccionar un índice aleatorio de la lista de todas las preguntas
                    const indiceAleatorio = Math.floor(Math.random() * preguntas.length);

                    // Seleccionar la pregunta correspondiente
                    const preguntaSeleccionada = preguntas[indiceAleatorio];

                    // Verificar si la pregunta ya ha sido seleccionada comparando el contenido
                    const existePregunta = preguntasSeleccionadas.some(p =>
                        p.pregunta === preguntaSeleccionada.pregunta
                    );

                    if (!existePregunta && Number(preguntaSeleccionada.puntaje) <= puntaje) {
                        preguntasSeleccionadas.push(preguntaSeleccionada);
                        puntajeTotal -= Number(preguntaSeleccionada.puntaje);
                    }
                }

                const exam = preguntasSeleccionadas.map(pregunta => ({
                    ...pregunta
                }));

                // Agregar el examen a la lista de exámenes
                exams.push(exam);
            }
        }
        else {
            for (let i = 0; i < numExams; i++) {
                let preguntasSeleccionadas: Pregunta[] = [];
                // Seleccionar preguntas de forma aleatoria hasta alcanzar el número deseado
                while (preguntasSeleccionadas.length < preguntasPorExamen) {
                    // Seleccionar la pregunta correspondiente
                    let preguntaSeleccionada = this.getRandomQuestion(preguntas);
                    let respuestasMezcladas = this.mezclarArray(preguntaSeleccionada.respuesta);
                    preguntaSeleccionada.respuesta = respuestasMezcladas;

                    // Verificar si la pregunta ya ha sido seleccionada comparando el contenido
                    const existePregunta = preguntasSeleccionadas.some(p =>
                        p.pregunta === preguntaSeleccionada.pregunta
                    );

                    if (!existePregunta) {
                        preguntasSeleccionadas.push(preguntaSeleccionada);
                    }
                }
                // Asignar puntaje a las preguntas seleccionadas si es necesario
                const pointsPerQuestion = 100 / preguntasPorExamen;

                const exam = preguntasSeleccionadas.map(pregunta => ({
                    ...pregunta,
                    puntaje: pointsPerQuestion,
                }));


                // Agregar el examen a la lista de exámenes
                exams.push(exam);
            }

        }

        return exams;
    }


    // Método para obtener una pregunta aleatoria
    getRandomQuestion(preguntas: Pregunta[]): Pregunta {
        const randomIndex = Math.floor(Math.random() * preguntas.length);
        return preguntas[randomIndex];
    }

    // Método para mezclar un array
 mezclarArray<T>(array: T[]): T[] {
        const resultado = [...array];
        for (let i = resultado.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Intercambiar elementos
            const temp = resultado[i];
            resultado[i] = resultado[j];
            resultado[j] = temp;
        }
        return resultado;
    }
}
