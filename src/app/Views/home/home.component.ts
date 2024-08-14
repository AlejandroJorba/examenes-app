import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ContactoComponent } from '../contacto/contacto.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ContactoComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {

}
