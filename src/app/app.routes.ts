import { Routes } from '@angular/router';
import { PreguntasComponent } from './Views/preguntas/preguntas.component';
import { HomeComponent } from './Views/home/home.component';
import { ContactoComponent } from './Views/contacto/contacto.component';

export const routes: Routes = [
    {path: '', component: HomeComponent, pathMatch: 'full'},
    {path: 'multiple-choice', component: PreguntasComponent},
    {path: 'contacto', component: ContactoComponent}
    
];
