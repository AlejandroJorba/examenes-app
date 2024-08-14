import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PreguntasComponent } from './Views/preguntas/preguntas.component';
import { NavbarComponent } from './Views/navbar/navbar.component';
import { HomeComponent } from './Views/home/home.component';
import { FooterComponent } from './Views/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PreguntasComponent, NavbarComponent, HomeComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'examenes-app';
}
