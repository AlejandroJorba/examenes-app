import { Injectable } from '@angular/core';
import { Pregunta } from '../Interfaces/Pregunta';

@Injectable({
    providedIn: 'root',
})
export class ExamService {


// Genera exámenes utilizando un método actualizado
generateExams(numExams: number, questionsPerExam: number, preguntas: Pregunta[]): any[] {
    const exams: any[] = [];
    
    // Generar la cantidad de exámenes especificada
    for (let i = 0; i < numExams; i++) {
        let preguntasSeleccionadas: Pregunta[] = [];
        
        // Seleccionar preguntas de forma aleatoria hasta alcanzar el número deseado
        while (preguntasSeleccionadas.length < questionsPerExam) {
            // Verificar que hay preguntas disponibles
            if (preguntas.length === 0) {
                console.warn("No hay suficientes preguntas disponibles para generar un examen completo.");
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
            
            if (!existePregunta) {
                preguntasSeleccionadas.push(preguntaSeleccionada);
            }
        }
        
        // Asignar puntaje a las preguntas seleccionadas si es necesario
        const pointsPerQuestion = 100 / questionsPerExam;
        
        const exam = preguntasSeleccionadas.map(pregunta => ({
            ...pregunta,
            puntaje: pointsPerQuestion,
        }));
        
        // Agregar el examen a la lista de exámenes
        exams.push(exam);
    }
    
    return exams;
}
        
        
    // Método para obtener una pregunta aleatoria
    getRandomQuestion(preguntas: Pregunta[]): any {
        const randomIndex = Math.floor(Math.random() * preguntas.length);
        return preguntas[randomIndex];
    }

    // Método para mezclar un array
    mezclarArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Intercambiar elementos
        }
        return array;
    }
    
}
